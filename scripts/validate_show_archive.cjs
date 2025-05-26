/**
 * ==========================================
 * Show Archive Validator (Read-Only)
 * ==========================================
 *
 * This script:
 * 1. Counts number of documents in the `show-archive` collection
 * 2. Checks if key bands exist in lineupSearch (e.g., Fluid Druid, Kinghorn)
 *
 * This is a read-only script — no writes or deletions are made.
 *
 * To run:
 *   node validate_show_archive.js
 */

const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const TARGET_BANDS = ["fluid druid", "kinghorn", "mammoth salmon"];

async function validateShowArchive() {
  const snapshot = await db.collection("show-archive").get();
  console.log(`✅ Total show-archive documents: ${snapshot.size}`);

  for (const band of TARGET_BANDS) {
    const bandSnap = await db.collection("show-archive")
      .where("lineupSearch", "array-contains", band)
      .limit(5)
      .get();

    if (bandSnap.empty) {
      console.warn(`❌ Band NOT FOUND in lineupSearch: ${band}`);
    } else {
      console.log(`✅ Found ${bandSnap.size}+ entries for: ${band}`);
      bandSnap.forEach(doc => {
        const d = doc.data();
        console.log(`  - ${d.date.toDate().toISOString().split("T")[0]} @ ${d.venue}, ${d.city}`);
      });
    }
  }
}

validateShowArchive().catch(console.error);
