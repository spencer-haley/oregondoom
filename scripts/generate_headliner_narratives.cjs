// === Node.js core modules ===
const fs = require("fs");
const path = require("path");

// === Constants for input/output ===
const INPUT_FILE = "headlinerFacts.json"; // Input JSON with headliner data
const PUBLIC_OUTPUT = "public/narrativeByEventId.json"; // Output path for the generated overlay narrative map

/**
 * Formats a date string (YYYY-MM-DD) into readable long-form
 * like "May 29th, 2025", with correct ordinal suffixes.
 */
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12)); // Force to UTC noon to avoid TZ shift
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const parts = formatter.formatToParts(date);
  const dayNum = parseInt(parts.find(p => p.type === "day").value);
  const suffix = (dayNum % 10 === 1 && dayNum !== 11) ? "st" :
                 (dayNum % 10 === 2 && dayNum !== 12) ? "nd" :
                 (dayNum % 10 === 3 && dayNum !== 13) ? "rd" : "th";
  const monthName = parts.find(p => p.type === "month").value;
  const yearNum = parts.find(p => p.type === "year").value;
  return `${monthName} ${dayNum}${suffix}, ${yearNum}`;
}

/**
 * Capitalizes each word in a string (title-case).
 */
function capitalizeWords(str) {
  return str.replace(/\b\w+/g, w => w[0].toUpperCase() + w.slice(1));
}

/**
 * Wraps a string in <em> for italic formatting in HTML.
 */
function italicize(str) {
  return `<em>${str}</em>`;
}

/**
 * Main narrative-building logic for a single headliner entry.
 */
function buildNarrative(entry) {
  const {
    headliner,
    eventDate,
    eventVenue,
    eventCity,
    supportActs = [],
    eventNotes = "",
    stats = {}
  } = entry;

  const {
    totalShowsInOregon = 0,
    allShows = [],
    earliestYear,
    mostRecentRelease = null,
    sharedShowsWithSupportActs = []
  } = stats;

  const parts = [];

  // === Build Openers or Notes line ===
  let formattedOpeners = "";
  const validSupportActs = supportActs.filter(
    s => s.toLowerCase().trim() !== headliner.toLowerCase().trim()
  );
  const hasValidEventNotes = eventNotes && eventNotes.trim().length > 0;
  const hasValidSupportActs = validSupportActs.length > 0;

  if (hasValidEventNotes) {
    formattedOpeners = ` with ${italicize(capitalizeWords(eventNotes.trim()))}`;
  } else if (hasValidSupportActs) {
    const formatted = validSupportActs.map(capitalizeWords).map(italicize);
    if (formatted.length === 1) {
      formattedOpeners = ` with ${formatted[0]}`;
    } else if (formatted.length === 2) {
      formattedOpeners = ` with ${formatted[0]} & ${formatted[1]}`;
    } else {
      const last = formatted.pop();
      formattedOpeners = ` with ${formatted.join(", ")} & ${last}`;
    }
  }

  // === Opening event line ===
  parts.push(`🔥 ${italicize(headliner)}${formattedOpeners} at ${italicize(eventVenue)} in ${eventCity} on ${formatDate(eventDate)}`);

  // === Oregon performance summary ===
  if (totalShowsInOregon === 0) {
    parts.push(`This marks their first documented performance in Oregon.`);
  } else {
    const spanNote = earliestYear && earliestYear < new Date().getFullYear()
      ? ` since ${earliestYear}` : '';
    parts.push(`${headliner} has ${totalShowsInOregon} documented Oregon show${totalShowsInOregon > 1 ? 's' : ''}${spanNote}.`);
  }

  // === Most recent release (if available) ===
  if (mostRecentRelease) {
    parts.push(
      `Their most recent release is ${italicize(mostRecentRelease.title)} (${mostRecentRelease.monthYear}): ` +
      `<a href="${mostRecentRelease.bandcampURL}" target="_blank" rel="noopener noreferrer" class="text-doomGreen font-bold">${mostRecentRelease.bandcampURL}</a>`
    );
  }

  // === Shared bills with support acts  ===
  const shared = sharedShowsWithSupportActs
    .filter(show => new Date(show.date) < new Date()) // Only past shows
    .map(show =>
      `They’ve also shared a bill with ${italicize(capitalizeWords(show.supportAct))} on ${formatDate(show.date)} at ${italicize(show.venue)} in ${show.city}.`
    );

  if (shared.length > 0) {
    parts.push(...shared);
  }

  // === Chronological list of past Oregon shows ===
  if (allShows.length > 0) {
    const lines = allShows.map(show => {
      const support = show.lineup
        .filter(name => name.toLowerCase() !== headliner.toLowerCase())
        .map(name => italicize(capitalizeWords(name)))
        .join(", ");
      let base = `- ${formatDate(show.date)} at ${italicize(show.venue)} in ${show.city}`;
      if (support) base += ` w/ ${support}`;
      return base;
    }).join("\n");
    parts.push(`Documented Shows on Oregon Doom:\n${lines}`);
  }

  return parts.join("\n\n"); // Separate blocks with spacing
}

/**
 * Main runner: reads headliner facts, generates narratives, and writes to output file.
 */
async function generateNarratives() {
  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const entries = JSON.parse(raw);
  const narrativeMap = {};

  for (const entry of entries) {
    const narrative = buildNarrative(entry);
    if (!narrative.includes("first documented performance in Oregon")) {
      // Exclude first-time-only narratives from publishing
      narrativeMap[entry.eventId] = narrative;
    }
  }

  // Write output to public narrative map
  fs.writeFileSync(PUBLIC_OUTPUT, JSON.stringify(narrativeMap, null, 2));
  console.log(`✅ narrativeByEventId.json written to /public`);
}

// Run the script and catch any errors
generateNarratives().catch(console.error);

