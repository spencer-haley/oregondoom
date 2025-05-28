/**
 * ==========================================
 * Oregon Doom CSV-to-Firestore Sync Script
 * ==========================================
 *
 * Syncs local concert CSV to the Firestore `show-archive` collection.
 * 
 * Skips unnecessary writes by comparing existing documents with new data.
 * Uses `idHash` generated from date, venue, city, and lineup.
 * 
 * DRY RUN supported via `--dry` flag.
 *
 * ------------------------------------------
 * ✅ TO RUN:
 *   node scripts/import-shows-from-csv.cjs
 *   node scripts/import-shows-from-csv.cjs --dry
 * ==========================================
 */

const admin = require("firebase-admin");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// === CONFIG ===
const COLLECTION_NAME = "show-archive";
const BATCH_LIMIT = 500;
const LOCAL_FILE = path.join(__dirname, "../public/OregonDoomShowChronicling.csv");
const isDryRun = process.argv.includes("--dry");

// === FIREBASE INIT ===
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const shows = new Map();

// === UTILS ===
function generateId({ date, venue, city, bands }) {
  const raw = `${date}_${venue}_${city}_${bands.join(",")}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

function parseDateInPacific(dateStr) {
  const [month, day, year] = dateStr.split(/[\/]/).map(n => parseInt(n));
  const date = new Date(Date.UTC(year, month - 1, day));
  const tzOffset = -420; // PST/PDT
  date.setUTCMinutes(date.getUTCMinutes() - tzOffset);
  return date;
}

// === CSV PARSER ===
async function processCSV() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(LOCAL_FILE)
      .pipe(csv())
      .on("data", (row) => {
        const normalized = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key.trim().replace(/^\uFEFF/, ""), value])
        );

        if (!normalized["Date"] || !normalized["Band(s)"]) return;

        const dateStr = normalized["Date"];
        const dateObj = parseDateInPacific(dateStr);
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

        const idHash = generateId({ date: dateStr, venue, city, bands });
        doc.idHash = idHash;

        shows.set(idHash, doc);
      })
      .on("end", resolve)
      .on("error", reject);
  });
}

// === FIRESTORE SYNC ===
async function uploadToFirestore() {
  console.log("📡 Fetching existing documents from Firestore...");
  const snapshot = await db.collection(COLLECTION_NAME).get();
  const existingDocs = new Map();
  snapshot.forEach(doc => existingDocs.set(doc.id, doc.data()));

  const toCreate = [];
  const toUpdate = [];
  const toDelete = [];

  for (const [id, newDoc] of shows.entries()) {
    if (!existingDocs.has(id)) {
      toCreate.push(newDoc);
    } else {
      const existingDoc = existingDocs.get(id);
      const clean = (obj) => JSON.stringify({ ...obj, date: obj.date.toDate().toISOString() });
      const changed = clean(existingDoc) !== clean(newDoc);
      if (changed) toUpdate.push(newDoc);
      existingDocs.delete(id); // mark matched
    }
  }

  for (const orphanId of existingDocs.keys()) {
    toDelete.push(orphanId);
  }

  console.log(`🧮 Summary — Create: ${toCreate.length}, Update: ${toUpdate.length}, Delete: ${toDelete.length}`);

  if (isDryRun) {
    if (toCreate.length || toUpdate.length || toDelete.length) {
      toCreate.forEach(doc => console.log(`🆕 Would create: ${doc.date.toDate().toISOString()} — ${doc.lineup.join(", ")} @ ${doc.venueCity}`));
      toUpdate.forEach(doc => console.log(`🔁 Would update: ${doc.date.toDate().toISOString()} — ${doc.lineup.join(", ")} @ ${doc.venueCity}`));
      toDelete.forEach(id => console.log(`❌ Would delete orphan: ${id}`));
    } else {
      console.log("✅ Dry run complete. No changes detected.");
    }
    return;
  }

  const total = toCreate.length + toUpdate.length + toDelete.length;
  for (let i = 0; i < total; i += BATCH_LIMIT) {
    const batch = db.batch();

    toCreate.slice(i, i + BATCH_LIMIT).forEach(doc => {
      const ref = db.collection(COLLECTION_NAME).doc(doc.idHash);
      batch.set(ref, doc);
      console.log(`🆕 Created: ${doc.date.toDate().toISOString()} — ${doc.lineup.join(", ")} @ ${doc.venueCity}`);
    });

    toUpdate.slice(i, i + BATCH_LIMIT).forEach(doc => {
      const ref = db.collection(COLLECTION_NAME).doc(doc.idHash);
      batch.set(ref, doc);
      console.log(`🔁 Updated: ${doc.date.toDate().toISOString()} — ${doc.lineup.join(", ")} @ ${doc.venueCity}`);
    });

    toDelete.slice(i, i + BATCH_LIMIT).forEach(id => {
      const ref = db.collection(COLLECTION_NAME).doc(id);
      batch.delete(ref);
      console.log(`❌ Deleted orphan: ${id}`);
    });

    if (batch._ops.length > 0) {
      await batch.commit();
      console.log(`✅ Committed batch ${Math.floor(i / BATCH_LIMIT) + 1}`);
    }
  }
}

// === MAIN ===
(async () => {
  console.log("📃 Parsing local CSV...");
  await processCSV();

  console.log(`📤 Syncing ${shows.size} shows to Firestore...`);
  await uploadToFirestore();

  console.log("✅ Done! Firestore is in sync with your local CSV.");
})();
