// ...[header unchanged]...
const admin = require("firebase-admin");
const csv = require("csv-parser");
const fs = require("fs");
const crypto = require("crypto");

const COLLECTION_NAME = "show-archive";
const DOWNLOAD_URL = "https://firebasestorage.googleapis.com/v0/b/oregondoom.firebasestorage.app/o/site_assets%2FOregonDoomShowChronicling.csv?alt=media&token=71c1fff5-67f8-4351-a728-c830279f6322";
const TEMP_FILE = "temp-OregonDoomShows.csv";
const BATCH_LIMIT = 500;

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
const shows = [];

function generateId({ date, venue, city, bands }) {
  const raw = `${date}_${venue}_${city}_${bands.join(",")}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

function parseDateInPacific(dateStr) {
  const [month, day, year] = dateStr.split(/[\/]/).map(n => parseInt(n));
  const date = new Date(Date.UTC(year, month - 1, day));
  const tzOffset = -420; // PST/PDT default offset in minutes; adjust for DST if needed
  date.setUTCMinutes(date.getUTCMinutes() - tzOffset);
  return date;
}

async function downloadCSV(fetch) {
  const response = await fetch(DOWNLOAD_URL);
  const fileStream = fs.createWriteStream(TEMP_FILE);
  return new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

async function processCSV() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(TEMP_FILE)
      .pipe(csv())
      .on("data", (row) => {
        const normalized = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key.trim().replace(/^\uFEFF/, ""), value])
        );

        if (!normalized["Date"] || !normalized["Band(s)"]) return;

        const dateObj = parseDateInPacific(normalized["Date"]);

        const venue = normalized["Venue"].trim();
        const city = normalized["City"].trim();
        const bands = normalized["Band(s)"].split("|").map(b => b.trim());

        const doc = {
          date: admin.firestore.Timestamp.fromDate(dateObj),
          venue,
          city,
          venueCity: `${venue}, ${city}`,
          eventName: normalized["Event"]?.trim() || null,
          lineup: bands,
          lineupSearch: bands.map(b => b.toLowerCase()),
          source: "CSV v1"
        };

        doc.idHash = generateId({
          date: normalized["Date"],
          venue,
          city,
          bands
        });

        shows.push(doc);
      })
      .on("end", resolve)
      .on("error", reject);
  });
}

async function uploadToFirestore() {
  for (let i = 0; i < shows.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = shows.slice(i, i + BATCH_LIMIT);

    chunk.forEach((doc) => {
      const ref = db.collection(COLLECTION_NAME).doc(doc.idHash);
      batch.set(ref, doc);
      console.log(`Queued for upload: ${doc.date.toDate().toISOString()} — ${doc.lineup.join(", ")} at ${doc.venueCity}`);
    });

    await batch.commit();
    console.log(`✅ Uploaded batch ${i / BATCH_LIMIT + 1}`);
  }
}

(async () => {
  const fetch = (await import("node-fetch")).default;

  console.log("⏬ Downloading CSV...");
  await downloadCSV(fetch);

  console.log("📃 Parsing CSV...");
  await processCSV();

  console.log(`🔥 Uploading ${shows.length} shows to Firestore...`);
  await uploadToFirestore();

  fs.unlinkSync(TEMP_FILE);
  console.log("✅ Done! Your `show-archive` collection is now updated with corrected date logic.");
})();
