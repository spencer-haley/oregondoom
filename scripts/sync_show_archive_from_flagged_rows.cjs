/**
 * ==========================================
 * sync_show_archive_from_flagged_rows.cjs
 * ==========================================
 * 
 * 🔄 Reads the CSV and checks for CreateFlag, UpdateFlag, or DeleteFlag.
 * 🧠 Generates idHash for any row missing one.
 * 🧪 DRY RUN mode with full summary.
 * ✅ Prompts for commit: 1 = Commit, 2 = Abandon.
 * ✅ After commit:
 *   - Clears flags from all affected rows
 *   - Removes rows with DeleteFlag = 1
 * 💾 Writes back to the same CSV file.
 * 
 * USAGE:
 *   node scripts/sync_show_archive_from_flagged_rows.cjs --dry
 *   node scripts/sync_show_archive_from_flagged_rows.cjs
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const { parse } = require("json2csv");
const crypto = require("crypto");
const readline = require("readline");

const CSV_PATH = path.resolve(__dirname, "../public/OregonDoomShowChronicling.csv");
const COLLECTION_NAME = "show-archive";
const BATCH_LIMIT = 500;
const isDryRun = process.argv.includes("--dry");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function generateHash(date, bands, venue, city) {
  const raw = `${date.trim()}_${bands.join(",").trim()}_${venue.trim()}_${city.trim()}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

function parseBands(str) {
  return str.split("|").map(b => b.trim()).filter(Boolean);
}

function parseDate(dateStr) {
  const [month, day, year] = dateStr.split(/[\/]/).map(n => parseInt(n));
  const date = new Date(Date.UTC(year, month - 1, day));
  const tzOffset = -420;
  date.setUTCMinutes(date.getUTCMinutes() - tzOffset);
  return admin.firestore.Timestamp.fromDate(date);
}

function generateLineupSearch(bands) {
  return Array.from(
    new Set(
      bands.flatMap(b => {
        const parts = b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        return [...parts, b.toLowerCase()];
      })
    )
  ).sort();
}

function promptYN(question) {
  return new Promise(resolve => {
    rl.question(`${question} (1 = Commit, 2 = Abort): `, input => {
      resolve(input.trim() === "1");
    });
  });
}

async function readCSV() {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csvParser())
      .on("data", row => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

(async () => {
  console.log("📖 Reading CSV...");
  let rows = await readCSV();

  const toCreate = [];
  const toUpdate = [];
  const toDelete = [];

  const cleaned = [];

  for (const row of rows) {
    const date = row["Date"];
    const bands = parseBands(row["Band(s)"] || "");
    const venue = row["Venue"];
    const city = row["City"];

    let idHash = row["idHash"]?.trim();
    if (!idHash && date && bands.length && venue && city) {
      idHash = generateHash(date, bands, venue, city);
      row["idHash"] = idHash;
    }

    const create = row["CreateFlag"] === "1";
    const update = row["UpdateFlag"] === "1";
    const del = row["DeleteFlag"] === "1";

    // Only compute lineupSearch if Create or Update
    if ((create || update) && bands.length) {
      const lineupSearch = generateLineupSearch(bands);
      row["lineupSearch"] = JSON.stringify(lineupSearch);
    }

    const doc = {
      id: idHash,
      doc: {
        idHash,
        date: parseDate(date),
        lineup: bands,
        venue,
        city,
        eventName: row["Event"]?.trim() || null,
        venueCity: `${venue}, ${city}`,
        source: "CSV v1",
        lineupSearch: row["lineupSearch"] ? JSON.parse(row["lineupSearch"]) : generateLineupSearch(bands)
      }
    };

    if (create) toCreate.push(doc);
    else if (update) toUpdate.push(doc);
    else if (del) toDelete.push(doc);
    else cleaned.push(row);
  }

  console.log(`🧮 Summary — Create: ${toCreate.length}, Update: ${toUpdate.length}, Delete: ${toDelete.length}`);

  if (isDryRun) {
    toCreate.forEach(r => console.log(`🆕 Would create: ${r.doc.date.toDate().toISOString()} — ${r.doc.lineup.join(", ")} @ ${r.doc.venueCity}`));
    toUpdate.forEach(r => console.log(`🔁 Would update: ${r.doc.date.toDate().toISOString()} — ${r.doc.lineup.join(", ")} @ ${r.doc.venueCity}`));
    toDelete.forEach(r => console.log(`❌ Would delete: ${r.id}`));
    console.log("✅ Dry run complete.");
    process.exit(0);
  }

  const confirm = await promptYN("Proceed with Firestore commit?");
  if (!confirm) {
    console.log("❌ Aborted.");
    process.exit(0);
  }

  const all = [...toCreate, ...toUpdate, ...toDelete];
  for (let i = 0; i < all.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = all.slice(i, i + BATCH_LIMIT);

    chunk.forEach(({ id, doc }) => {
      const ref = db.collection(COLLECTION_NAME).doc(id);
      if (toCreate.some(d => d.id === id)) batch.set(ref, doc);
      else if (toUpdate.some(d => d.id === id)) batch.set(ref, doc);
      else if (toDelete.some(d => d.id === id)) batch.delete(ref);
    });

    await batch.commit();
  }

  console.log("🚀 Firestore committed.");

  // === CSV REWRITE ===
  const updatedCSV = rows
    .filter(r => r["DeleteFlag"] !== "1")
    .map(r => {
      r["CreateFlag"] = "";
      r["UpdateFlag"] = "";
      r["DeleteFlag"] = "";
      return r;
    });

  const fields = Object.keys(updatedCSV[0]);
  const csvOutput = parse(updatedCSV, { fields });
  fs.writeFileSync(CSV_PATH, csvOutput, "utf8");

  console.log(`💾 CSV updated: ${CSV_PATH}`);
  console.log("🎉 Sync complete.");

  rl.close();
})();
