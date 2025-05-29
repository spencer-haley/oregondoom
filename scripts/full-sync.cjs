/**
 * ==========================================
 * Oregon Doom Full Sync Orchestrator
 * ==========================================
 *
 * This script runs the full workflow:
 *  - backfill_bandsearch.cjs (optimized)
 *  - sync_show_archive_from_flagged_rows.cjs
 *  - generate_headliner_facts.cjs
 *  - generate_headliner_narratives.cjs
 *  - Git commit & Firebase deploy
 *
 * DRY RUN phase runs first to preview changes.
 * Use --fast to skip dry run and prompts.
 *
 * ------------------------------------------
 * ✅ TO RUN:
 *   node scripts/full-sync.cjs
 *   node scripts/full-sync.cjs --fast
 * ==========================================
 */

console.log("✅ Script is loading...");

const { execSync } = require("child_process");
const readline = require("readline");

const isFast = process.argv.includes("--fast");

function run(cmd, label) {
  const labelColor = {
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    reset: "\x1b[0m"
  };
  if (label) {
    const color = labelColor[label] || labelColor.reset;
    console.log(`\n${color}%s${labelColor.reset}`, `🚀 ${cmd}`);
  } else {
    console.log(`\n🚀 Running: ${cmd}`);
  }
  execSync(cmd, { stdio: "inherit" });
}

async function promptUser(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(message, answer => {
    rl.close();
    resolve(answer.trim());
  }));
}

(async () => {
  if (!isFast) {
    console.log("🧪 Starting DRY RUN of Oregon Doom Full Sync...");

    run("node scripts/backfill_bandsearch.cjs --dry", "green");
    run("node scripts/sync_show_archive_from_flagged_rows.cjs --dry", "yellow");

    console.log("\n📄 Generating local narrative and fact files...");
    run("node scripts/generate_headliner_facts.cjs");
    run("node scripts/generate_headliner_narratives.cjs");

    const proceed = await promptUser("\n✅ Proceed with full deploy? (1 = Yes, 2 = Cancel): ");
    if (proceed !== "1") {
      console.log("🛑 Sync canceled by user.");
      process.exit(0);
    }
  } else {
    console.log("⚡ FAST MODE ENABLED — Skipping dry run and proceeding to full sync...");
  }

  console.log("\n🔥 Executing full sync...");

  run("node scripts/backfill_bandsearch.cjs", "green");
  run("node scripts/sync_show_archive_from_flagged_rows.cjs", "green");
  run("node scripts/generate_headliner_facts.cjs");
  run("node scripts/generate_headliner_narratives.cjs");

  run("git add .");
  run('git commit -m "Full sync and narrative update"');
  run("git push origin main");
  run("npm run build");
  run("firebase deploy --only hosting");

  console.log("\n✅ Full sync and deployment complete!");
})();
