/**
 * ==========================================
 * Enrich Events with `lineupSearch`
 * ==========================================
 *
 * Updates only `show-archive` documents where the `lineupSearch` field
 * differs from the generated version.
 *
 * ✅ Skips already-correct records
 * ✅ Supports --dry mode
 * ✅ Outputs JSON diff log to `lineupSearch-diff-log.json`
 *
 * TO RUN DRY:
 *   node scripts/enrich-events-with-lineupSearch.cjs --dry
 *
 * TO RUN LIVE:
 *   node scripts/enrich-events-with-lineupSearch.cjs
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const isDry = process.argv.includes("--dry");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const collection = db.collection("show-archive");
const BATCH_SIZE = 500;

function normalize(arr) {
  return Array.from(new Set(arr)).sort();
}

async function enrichLineupSearch() {
  const snapshot = await collection.get();
  const updates = [];

  console.log(`📦 Loaded ${snapshot.size} event documents.`);

  snapshot.forEach(doc => {
    const data = doc.data();
    const lineup = data.lineup || [];

    const generated = normalize(
      lineup.flatMap(band =>
        band
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
          .concat(band.toLowerCase())
      )
    );

    const existing = normalize(data.lineupSearch || []);
    const isEqual = JSON.stringify(generated) === JSON.stringify(existing);

    if (!isEqual) {
      updates.push({
        id: doc.id,
        ref: doc.ref,
        existing,
        generated
      });
    }
  });

  console.log(`⚙️ Found ${updates.length} document(s) needing lineupSearch update.`);

  const diffLog = updates.map(({ id, existing, generated }) => ({
    id,
    existing,
    generated
  }));
  const logPath = path.resolve("lineupSearch-diff-log.json");
  fs.writeFileSync(logPath, JSON.stringify(diffLog, null, 2));
  console.log(`📝 Diff log saved to ${logPath}`);

  if (isDry) {
    updates.slice(0, 20).forEach(({ id, generated }) => {
      console.log(`🔍 Would update: ${id} → [${generated.join(", ")}]`);
    });
    if (updates.length > 20) {
      console.log(`...and ${updates.length - 20} more.`);
    }
    console.log("✅ Dry run complete. No changes committed.");
    return;
  }

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = updates.slice(i, i + BATCH_SIZE);

    chunk.forEach(({ ref, generated }) => {
      batch.update(ref, { lineupSearch: generated });
      console.log(`✅ Queued update: ${ref.id} → [${generated.join(", ")}]`);
    });

    await batch.commit();
    console.log(`🚀 Committed batch ${i / BATCH_SIZE + 1}`);
  }

  console.log("🎉 All lineupSearch fields updated where needed.");
}

enrichLineupSearch().catch(console.error);
