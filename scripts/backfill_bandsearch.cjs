/**
 * ==========================================
 * Backfill Script: Add `bandSearch` to releases_v2
 * ==========================================
 *
 * This version adds diff logging to a local JSON file (`bandsearch-diff-log.json`)
 * to help verify only changed documents would be updated.
 *
 * ✅ Skips identical docs
 * ✅ Supports --dry mode to preview updates
 * ✅ Writes a log file with changed document info
 *
 * TO RUN DRY:
 *   node scripts/backfill_bandsearch_with_log.cjs --dry
 *
 * TO RUN LIVE:
 *   node scripts/backfill_bandsearch_with_log.cjs
 * ==========================================
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const isDry = process.argv.includes("--dry");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const BATCH_SIZE = 500;

function generateBandSearch(artist) {
  const tokens = artist.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return Array.from(new Set([artist.toLowerCase(), ...tokens]));
}

function normalize(arr) {
  return Array.from(new Set(arr)).sort();
}

async function backfillBandSearch() {
  const snapshot = await db.collection("releases_v2").get();
  const updates = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.artist) return;

    const current = normalize(data.bandSearch || []);
    const generated = normalize(generateBandSearch(data.artist));

    const isEqual = JSON.stringify(current) === JSON.stringify(generated);
    if (!isEqual) {
      updates.push({
        id: doc.id,
        ref: doc.ref,
        artist: data.artist,
        current,
        generated
      });
    }
  });

  console.log(`⚙️ Found ${updates.length} document(s) needing update out of ${snapshot.size}`);

  // Write JSON diff log
  const logData = updates.map(({ id, artist, current, generated }) => ({
    id,
    artist,
    current,
    generated
  }));
  const logPath = path.resolve("bandsearch-diff-log.json");
  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
  console.log(`📝 Diff log saved to ${logPath}`);

  if (isDry) {
    updates.slice(0, 20).forEach(({ id, generated }) => {
      console.log(`🔍 Would update: ${id} → [${generated.join(", ")}]`);
    });
    if (updates.length > 20) console.log(`...and ${updates.length - 20} more.`);
    console.log("✅ Dry run complete. No changes committed.");
    return;
  }

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = updates.slice(i, i + BATCH_SIZE);

    chunk.forEach(({ ref, generated }) => {
      batch.update(ref, { bandSearch: generated });
      console.log(`✅ Queued update: ${ref.id} → [${generated.join(", ")}]`);
    });

    await batch.commit();
    console.log(`🚀 Committed batch ${i / BATCH_SIZE + 1}`);
  }

  console.log("🎉 All updates committed to Firestore.");
}

backfillBandSearch().catch(console.error);
