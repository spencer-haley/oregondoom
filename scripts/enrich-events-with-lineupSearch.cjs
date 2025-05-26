/**
 * ================================
 * Enrich Events with Lineup Search
 * ================================
 *
 * This script reads all documents from the "events" collection,
 * extracts artist names from `eventName` and `eventNotes`,
 * and creates a new field `lineupSearch[]` for band-matching.
 *
 * Run:
 *   node scripts/enrich-events-with-lineupSearch.cjs
 */

const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
const BATCH_LIMIT = 500;

function tokenize(name) {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function extractActs(eventName = "", eventNotes = "") {
  const allNames = [eventName.trim()];

  if (eventNotes) {
    const splitActs = eventNotes
      .split(/[\+&|\/,]| and /i)        // handles: +, &, |, /, ,, "and"
      .map(s => s.trim())
      .filter(Boolean);

    allNames.push(...splitActs);
  }

  // Remove duplicates and flatten to include both full names + tokenized
  return Array.from(
    new Set(
      allNames.flatMap(name => [
        name.toLowerCase(),
        ...tokenize(name)
      ])
    )
  );
}

async function enrichEvents() {
  const snapshot = await db.collection("events").get();
  console.log(`📦 Loaded ${snapshot.size} event documents.`);

  const events = snapshot.docs;
  for (let i = 0; i < events.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = events.slice(i, i + BATCH_LIMIT);

    chunk.forEach(doc => {
      const data = doc.data();
      const eventName = data.eventName || "";
      const eventNotes = data.eventNotes || "";

      const lineupSearch = extractActs(eventName, eventNotes);
      const ref = db.collection("events").doc(doc.id);
      batch.update(ref, { lineupSearch });

      console.log(`✅ [${doc.id}] → ${lineupSearch.join(", ")}`);
    });

    await batch.commit();
    console.log(`📝 Committed batch ${i / BATCH_LIMIT + 1}`);
  }

  console.log("🎉 All events updated with corrected lineupSearch.");
}

enrichEvents().catch((err) => {
  console.error("❌ Error enriching events:", err);
});
