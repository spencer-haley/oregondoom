/**
 * ==========================================
 * Backfill Script: Add `bandSearch` to releases_v2
 * ==========================================
 *
 * This script updates all documents in the `releases_v2` collection
 * by adding a `bandSearch` field based only on the canonical `artist` name.
 *
 * It preserves existing data and avoids modifying anything else.
 *
 * Run with:
 *   node scripts/backfill_bandsearch.cjs
 */

const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.applicationDefault() });

const db = admin.firestore();
const BATCH_SIZE = 500;

function generateBandSearch(artist) {
  const tokens = artist.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return [artist.toLowerCase(), ...tokens];
}

async function backfillBandSearch() {
  const snapshot = await db.collection("releases_v2").get();
  const updates = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.artist) return; // skip broken entries
    const bandSearch = generateBandSearch(data.artist);
    updates.push({ ref: doc.ref, bandSearch });
  });

  console.log(`⚙️ Preparing to update ${updates.length} documents...`);

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = updates.slice(i, i + BATCH_SIZE);

    chunk.forEach(({ ref, bandSearch }) => {
      batch.update(ref, { bandSearch });
      console.log(`✅ Queued update: ${ref.id} → [${bandSearch.join(", ")}]
`);
    });

    await batch.commit();
    console.log(`🚀 Committed batch ${i / BATCH_SIZE + 1}`);
  }

  console.log("🎉 All documents updated with bandSearch field.");
}

backfillBandSearch().catch(console.error);
