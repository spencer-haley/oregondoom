/**
 * ==========================================
 * Full Firestore Reset from Hashed CSV
 * ==========================================
 *
 * ⚠️ WARNING: This will WIPE ALL EXISTING DATA
 * in the `show-archive` collection and replace
 * it with fresh records from the local CSV.
 *
 * Reads:
 * - idHash
 * - Date, Band(s), Venue, City, Event
 * - lineupSearch (JSON string from CSV)
 *
 * TO RUN:
 *   node scripts/show_archive_wipe_replace.cjs
 */

const admin = require("firebase-admin");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const COLLECTION_NAME = "show-archive";
const LOCAL_FILE = path.join(__dirname, "../public/OregonDoomShowChronicling.csv");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const BATCH_LIMIT = 500;
const newDocs = new Map();

function parseDateInPacific(dateStr) {
  const [month, day, year] = dateStr.split(/[\/]/).map(n => parseInt(n));
  const date = new Date(Date.UTC(year, month - 1, day));
  const tzOffset = -420; // PST/PDT
  date.setUTCMinutes(date.getUTCMinutes() - tzOffset);
  return date;
}

async function loadCSV() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(LOCAL_FILE)
      .pipe(csv())
      .on("data", (row) => {
        const idHash = row["idHash"];
        if (!idHash) return;

        const bands = row["Band(s)"].split("|").map(b => b.trim());
        const dateObj = parseDateInPacific(row["Date"]);

        let parsedLineupSearch;
        try {
          parsedLineupSearch = JSON.parse(row["lineupSearch"]);
        } catch (err) {
          parsedLineupSearch = bands.map(b => b.toLowerCase());
        }

        const doc = {
          date: admin.firestore.Timestamp.fromDate(dateObj),
          venue: row["Venue"].trim(),
          city: row["City"].trim(),
          venueCity: `${row["Venue"].trim()}, ${row["City"].trim()}`,
          eventName: row["Event"]?.trim() || null,
          lineup: bands,
          lineupSearch: parsedLineupSearch,
          source: "CSV v1",
          idHash: idHash
        };

        newDocs.set(idHash, doc);
      })
      .on("end", resolve)
      .on("error", reject);
  });
}

async function deleteAllDocs() {
  const snapshot = await db.collection(COLLECTION_NAME).get();
  const batches = [];

  console.log(`⚠️ Deleting ${snapshot.size} documents from Firestore...`);

  for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    snapshot.docs.slice(i, i + BATCH_LIMIT).forEach(doc => {
      batch.delete(doc.ref);
    });
    batches.push(batch.commit());
  }

  await Promise.all(batches);
  console.log("🗑️ All existing documents deleted.");
}

async function insertAllDocs() {
  const docsArray = Array.from(newDocs.entries());

  for (let i = 0; i < docsArray.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    docsArray.slice(i, i + BATCH_LIMIT).forEach(([id, doc]) => {
      const ref = db.collection(COLLECTION_NAME).doc(id);
      batch.set(ref, doc);
      console.log(`✅ Inserted: ${doc.date.toDate().toISOString()} — ${doc.lineup.join(", ")} @ ${doc.venueCity}`);
    });
    await batch.commit();
    console.log(`🚀 Committed batch ${Math.floor(i / BATCH_LIMIT) + 1}`);
  }

  console.log("🎉 Firestore successfully reset and repopulated.");
}

// === MAIN ===
(async () => {
  console.log("📃 Loading local CSV...");
  await loadCSV();

  await deleteAllDocs();
  await insertAllDocs();
})();
