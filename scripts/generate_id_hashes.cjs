/**
 * ==============================================
 * Generate idHash and lineupSearch for CSV rows
 * ==============================================
 * 
 * ✅ Only adds idHash if missing
 * ✅ Adds lineupSearch based on "Band(s)" column
 * ✅ Does NOT touch Firestore
 * ✅ Overwrites the CSV in-place
 * 
 * TO RUN:
 *   node scripts/generate_id_hashes.cjs
 */

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { parse } = require("json2csv");
const crypto = require("crypto");

const INPUT_PATH = path.join(__dirname, "../public/OregonDoomShowChronicling.csv");
const OUTPUT_PATH = INPUT_PATH;

function generateIdHash({ date, bands, venue, city }) {
  const raw = `${date.trim()}_${bands.trim()}_${venue.trim()}_${city.trim()}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

function generateLineupSearch(bandsField) {
  const bands = bandsField.split("|").map(b => b.trim());
  const tokens = new Set();

  bands.forEach(band => {
    const lower = band.toLowerCase();
    lower.split(/[^a-z0-9]+/).forEach(t => t && tokens.add(t));
    tokens.add(lower); // full band name too
  });

  return Array.from(tokens).sort(); // Optional: sort for consistency
}

async function processCSV() {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(INPUT_PATH)
      .pipe(csv())
      .on("data", row => {
        const normalized = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key.trim(), value?.trim()])
        );

        const { Date, "Band(s)": Bands, Venue, City } = normalized;

        // Skip broken rows
        if (!Date || !Bands || !Venue || !City) {
          rows.push(normalized);
          return;
        }

        // Add idHash if missing
        if (!normalized.idHash) {
          normalized.idHash = generateIdHash({
            date: Date,
            bands: Bands,
            venue: Venue,
            city: City,
          });
        }

        // Always regenerate lineupSearch
        normalized.lineupSearch = JSON.stringify(generateLineupSearch(Bands));

        rows.push(normalized);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

(async () => {
  console.log("🔁 Processing rows to generate idHash and lineupSearch...");
  const updatedRows = await processCSV();

  const csvOutput = parse(updatedRows, {
    fields: Object.keys(updatedRows[0]),
    quote: '"',
  });

  fs.writeFileSync(OUTPUT_PATH, csvOutput);
  console.log(`✅ Output written to: ${OUTPUT_PATH}`);
})();
