const admin = require("firebase-admin");
const fs = require("fs");

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
const OUTPUT_FILE = "headlinerFacts.json";

function formatMonthYear(timestamp) {
  const date = timestamp.toDate();
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function toPacificISO(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

function extractHrefFromEmbed(embed) {
  const match = embed.match(/href=\"(.*?)\"/);
  return match ? match[1] : null;
}

async function getPastShows(headliner, excludeDateISO) {
  const trimmed = headliner.trim().toLowerCase();

  const snapshot = await db.collection("show-archive")
    .where("lineupSearch", "array-contains", trimmed)
    .orderBy("date", "desc")
    .get();

  const shows = snapshot.docs
    .map(doc => doc.data())
    .filter(show => toPacificISO(show.date.toDate()) !== excludeDateISO);

  const allShows = shows.map(show => ({
    date: toPacificISO(show.date.toDate()),
    venue: show.venue,
    city: show.city,
    lineup: show.lineup
  }));

  let earliestYear = null;
  if (allShows.length > 0) {
    const years = allShows.map(s => new Date(s.date).getFullYear());
    earliestYear = Math.min(...years);
  }

  return {
    total: allShows.length,
    allShows,
    earliestYear
  };
}

async function getMostRecentRelease(headliner) {
  const lowerHeadliner = headliner.trim().toLowerCase();

  const snapshot = await db.collection("releases_v2")
    .where("bandSearch", "array-contains", lowerHeadliner)
    .orderBy("date", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const release = snapshot.docs[0].data();
  return {
    title: release.title,
    monthYear: formatMonthYear(release.date),
    bandcampURL: extractHrefFromEmbed(release.embed)
  };
}

async function getSharedShows(headliner, supportActs) {
  const trimmedHeadliner = headliner.trim().toLowerCase();
  if (!supportActs.length) return [];

  const terms = [trimmedHeadliner, ...supportActs.map(a => a.toLowerCase())];
  const uniqueTerms = Array.from(new Set(terms)).slice(0, 10);

  const snapshot = await db.collection("show-archive")
    .where("lineupSearch", "array-contains-any", uniqueTerms)
    .get();

  const results = [];
  const nowISO = toPacificISO(new Date());

  snapshot.forEach(doc => {
    const data = doc.data();
    const lowerLineup = data.lineupSearch || [];
    const showDateISO = toPacificISO(data.date.toDate());

    if (
      showDateISO < nowISO &&
      lowerLineup.includes(trimmedHeadliner) &&
      supportActs.some(support => lowerLineup.includes(support.toLowerCase()))
    ) {
      const matchingSupport = supportActs.find(support =>
        lowerLineup.includes(support.toLowerCase())
      );

      results.push({
        supportAct: matchingSupport,
        date: showDateISO,
        venue: data.venue,
        city: data.city
      });
    }
  });

  return results;
}

async function generateHeadlinerFacts() {
  const eventsSnapshot = await db.collection("events")
    .where("approvalStatus", "==", true)
    .where("eventDate", ">=", new Date())
    .orderBy("eventDate")
    .get();

  const results = [];

  for (const doc of eventsSnapshot.docs) {
    const event = doc.data();
    const eventId = doc.id;
    const headliner = event.eventName;
    const formattedEventDate = toPacificISO(event.eventDate.toDate());

    const eventNotes = (event.eventNotes || "").trim();
    const supportActs = eventNotes
      ? eventNotes
          .split(/,|&| and /i)
          .map(s => s.trim())
          .filter(s => s.length > 0 && s.toLowerCase() !== headliner.toLowerCase().trim())
      : [];

    const pastShowData = await getPastShows(headliner, formattedEventDate);
    const mostRecentRelease = await getMostRecentRelease(headliner);
    const sharedShows = await getSharedShows(headliner, supportActs);

    results.push({
      eventId,
      headliner,
      eventDate: formattedEventDate,
      eventCity: event.eventCity,
      eventVenue: event.eventVenue,
      supportActs,
      eventNotes,
      stats: {
        totalShowsInOregon: pastShowData.total,
        allShows: pastShowData.allShows,
        earliestYear: pastShowData.earliestYear,
        mostRecentRelease,
        sharedShowsWithSupportActs: sharedShows
      }
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`✅ Headliner facts written to ${OUTPUT_FILE}`);
}

generateHeadlinerFacts().catch(console.error);
