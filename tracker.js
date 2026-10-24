#!/usr/bin/env node
// SentinelOps — Akanksha's daily tracker
// Part: knowledge base + vector search, diagnosis agent, dashboard,
//       chaos panel UI, incident history, demo.
//
// Usage:
//   node tracker.js           progress + today's task
//   node tracker.js all       every task, week by week
//   node tracker.js done 3    mark day 3 done (saves today's date)
//   node tracker.js undo 3    mark day 3 not done
//
// Each task is sized for one 45–60 minute session and ends with a commit.
// Fell behind? Skip the "Buffer" days first. Still behind? Cut in this order:
// incident history page (22) → dashboard polish (25) → traffic-flood support.

const tasks = [
  // ───────────── Week 1: setup + dashboard skeleton ─────────────
  {
    day: 1, date: "2026-10-25", week: 1,
    title: "Set up the repo and your workflow",
    steps: [
      "Accept the GitHub invite, clone the repo, create branch feature/akanksha",
      "Add tracker.js, CLAUDE.md, CONTRACTS.md and the updated .gitignore",
      "Run `node tracker.js` to check it works",
      "Push the branch and open a PR so Prarthana sees the files",
    ],
    commit: "chore: add tracker, CLAUDE.md, contracts draft, gitignore",
    done: false, doneOn: null,
  },
  {
    day: 2, date: "2026-10-26", week: 1,
    title: "Agree on CONTRACTS.md with Prarthana",
    steps: [
      "15-minute call: go through every format in CONTRACTS.md",
      "Change anything she disagrees with, then mark it AGREED",
      "Agree the folder ownership table at the bottom",
    ],
    commit: "docs: finalise data contracts",
    done: false, doneOn: null,
  },
  {
    day: 3, date: "2026-10-27", week: 1,
    title: "Create the dashboard app",
    steps: [
      "Ask Claude Code to create a Next.js + Tailwind app in /dashboard",
      "Run it with `npm run dev` and open it in the browser",
      "Ask Claude Code to explain the folder structure it created",
    ],
    commit: "feat(dashboard): scaffold Next.js app",
    done: false, doneOn: null,
  },
  {
    day: 4, date: "2026-10-28", week: 1,
    title: "Dashboard layout with fake data",
    steps: [
      "Three panels: service map, live log stream, agent reasoning feed",
      "Create dashboard/lib/fakeData.js using the formats in CONTRACTS.md",
      "Fill each panel from the fake data",
    ],
    commit: "feat(dashboard): three-panel layout with fake data",
    done: false, doneOn: null,
  },
  {
    day: 5, date: "2026-10-29", week: 1,
    title: "Live service map",
    steps: [
      "Install @xyflow/react; draw Login, Orders, Payments as nodes",
      "Draw dependency arrows (Orders → Payments, Orders → Login)",
      "Colour nodes green / amber / red from a status value",
    ],
    commit: "feat(dashboard): service map with health colours",
    done: false, doneOn: null,
  },
  {
    day: 6, date: "2026-10-30", week: 1,
    title: "Log stream panel",
    steps: [
      "Show fake logs scrolling in, newest at the bottom",
      "Colour by level: INFO grey, WARN amber, ERROR red",
      "Add a fake timer that pushes a new log every second",
    ],
    commit: "feat(dashboard): live log stream panel",
    done: false, doneOn: null,
  },
  {
    day: 7, date: "2026-10-31", week: 1,
    title: "Buffer: catch up + weekly check-in",
    steps: [
      "Finish anything left from this week",
      "Merge your PR into main with Prarthana",
      "Write 3 lines in NOTES.md: what you learned this week",
    ],
    commit: "docs: week 1 notes",
    done: false, doneOn: null,
  },

  // ───────────── Week 2: knowledge base + chaos panel ─────────────
  {
    day: 8, date: "2026-11-01", week: 2,
    title: "Learn embeddings",
    steps: [
      "In /knowledge_base, write a tiny Python script with sentence-transformers",
      "Embed 4 sentences and print which two are most similar",
      "Ask Claude Code: what is an embedding and cosine similarity?",
    ],
    commit: "feat(kb): embeddings experiment",
    done: false, doneOn: null,
  },
  {
    day: 9, date: "2026-11-02", week: 2,
    title: "Write past incidents (part 1)",
    steps: [
      "Create knowledge_base/incidents.json",
      "Write 8 realistic incidents: symptoms, root cause, fix, recovery time",
      "Cover all 3 failure types: crash, bad deploy, traffic flood",
    ],
    commit: "feat(kb): first 8 past incidents",
    done: false, doneOn: null,
  },
  {
    day: 10, date: "2026-11-03", week: 2,
    title: "Write past incidents (part 2)",
    steps: [
      "Add 8–12 more incidents (15–20 total)",
      "Include a few tricky ones that look alike but have different fixes",
    ],
    commit: "feat(kb): complete incident knowledge base",
    done: false, doneOn: null,
  },
  {
    day: 11, date: "2026-11-04", week: 2,
    title: "Similar-incident search (in memory)",
    steps: [
      "Write search_similar(text, k=3) that returns the closest incidents",
      "Test with a fake alert for each failure type",
      "Check the top result makes sense; tweak incident wording if not",
    ],
    commit: "feat(kb): in-memory similar incident search",
    done: false, doneOn: null,
  },
  {
    day: 12, date: "2026-11-05", week: 2,
    title: "Move search into Cassandra",
    steps: [
      "Ask Prarthana for her Docker Cassandra setup",
      "Create the incidents table with a vector column; load the incidents",
      "Make search_similar use Cassandra vector search",
      "Keep the in-memory version as a fallback",
    ],
    commit: "feat(kb): Cassandra vector search for incidents",
    done: false, doneOn: null,
  },
  {
    day: 13, date: "2026-11-06", week: 2,
    title: "Chaos panel UI",
    steps: [
      "Buttons: pick a service + failure type (crash / bad deploy / flood)",
      "Call the chaos endpoint from CONTRACTS.md (mock it if not ready)",
      "Show a 'failure injected at hh:mm:ss' message",
    ],
    commit: "feat(dashboard): chaos panel",
    done: false, doneOn: null,
  },
  {
    day: 14, date: "2026-11-07", week: 2,
    title: "Integration day 1",
    steps: [
      "Connect the dashboard to Prarthana's real WebSocket feed",
      "Press a chaos button and watch a real service turn red",
      "Write down anything that doesn't match CONTRACTS.md and fix it together",
    ],
    commit: "feat: connect dashboard to live services",
    done: false, doneOn: null,
  },

  // ───────────── Week 3: the agent ─────────────
  {
    day: 15, date: "2026-11-08", week: 3,
    title: "Learn the LLM API",
    steps: [
      "Put your API key in .env (never commit it!)",
      "In /agent, send one prompt and get JSON back",
      "Ask Claude Code to explain each line",
    ],
    commit: "feat(agent): first LLM call",
    done: false, doneOn: null,
  },
  {
    day: 16, date: "2026-11-09", week: 3,
    title: "Agent v0 (rules, no AI)",
    steps: [
      "Function diagnose(alert) → decision in the CONTRACTS.md format",
      "Simple rules: deploy in last 2 min → rollback; service down → restart",
      "This lets the full loop work before the AI is ready",
    ],
    commit: "feat(agent): rule-based diagnosis v0",
    done: false, doneOn: null,
  },
  {
    day: 17, date: "2026-11-10", week: 3,
    title: "Agent v1 (LLM)",
    steps: [
      "Replace the rules with an LLM call: alert + recent events → decision",
      "Force JSON output and validate it before using it",
      "Test on 3 fake alerts, one per failure type",
    ],
    commit: "feat(agent): LLM diagnosis",
    done: false, doneOn: null,
  },
  {
    day: 18, date: "2026-11-11", week: 3,
    title: "Give the agent tools",
    steps: [
      "Tools: search_past_incidents(text), get_recent_events(service)",
      "Let the LLM call them (function calling) before deciding",
      "Include the matched incident id in the explanation",
    ],
    commit: "feat(agent): incident search + recent events tools",
    done: false, doneOn: null,
  },
  {
    day: 19, date: "2026-11-12", week: 3,
    title: "Confidence + human approval",
    steps: [
      "If confidence < 0.7 → needs_approval: true instead of auto-fixing",
      "Only allow actions 'rollback' and 'restart'; reject anything else",
      "Test: feed a confusing alert and check it asks for approval",
    ],
    commit: "feat(agent): confidence threshold and safe actions",
    done: false, doneOn: null,
  },
  {
    day: 20, date: "2026-11-13", week: 3,
    title: "Agent reasoning feed on the dashboard",
    steps: [
      "Show each step live: alert → searching → match found → decision → fixing",
      "Show confidence and an Approve button when approval is needed",
    ],
    commit: "feat(dashboard): agent reasoning feed",
    done: false, doneOn: null,
  },
  {
    day: 21, date: "2026-11-14", week: 3,
    title: "Integration day 2 — full loop + FEATURE FREEZE",
    steps: [
      "Run the whole loop: break → detect → diagnose → fix → green",
      "Time it; goal under 60 seconds",
      "No new features after today",
    ],
    commit: "feat: full break-to-heal loop working",
    done: false, doneOn: null,
  },

  // ───────────── Week 4: test, polish, demo ─────────────
  {
    day: 22, date: "2026-11-15", week: 4,
    title: "Incident history page",
    steps: [
      "List past incidents: time, service, root cause, action, recovery time",
      "Read them from Cassandra",
    ],
    commit: "feat(dashboard): incident history page",
    done: false, doneOn: null,
  },
  {
    day: 23, date: "2026-11-16", week: 4,
    title: "Test runs",
    steps: [
      "With Prarthana: run each failure type 10 times",
      "Record detect time, recover time, correct? in tests/results.md",
    ],
    commit: "test: 30 recorded test runs",
    done: false, doneOn: null,
  },
  {
    day: 24, date: "2026-11-17", week: 4,
    title: "Fix the flakiest problem",
    steps: [
      "Pick the most common failure from tests/results.md",
      "Fix it, then re-run that case 10 times",
    ],
    commit: "fix: improve reliability of <issue>",
    done: false, doneOn: null,
  },
  {
    day: 25, date: "2026-11-18", week: 4,
    title: "Dashboard polish",
    steps: [
      "Add a big recovery timer (0s → healed in 38s)",
      "Clean spacing, readable on a projector, no console errors",
    ],
    commit: "style(dashboard): demo polish",
    done: false, doneOn: null,
  },
  {
    day: 26, date: "2026-11-19", week: 4,
    title: "README for recruiters",
    steps: [
      "Architecture diagram, how to run, tech stack, measured results",
      "Record a short GIF of the heal loop and put it at the top",
    ],
    commit: "docs: README with architecture, results and demo GIF",
    done: false, doneOn: null,
  },
  {
    day: 27, date: "2026-11-20", week: 4,
    title: "Backup video + rehearsal",
    steps: [
      "Record a perfect run as a backup demo video",
      "Rehearse the pitch: chaos button in the first 30 seconds",
    ],
    commit: "docs: add demo video link",
    done: false, doneOn: null,
  },
  {
    day: 28, date: "2026-11-21", week: 4,
    title: "Final run-through",
    steps: [
      "Fresh clone → docker compose up → full demo, start to finish",
      "Practise answers: why Cassandra? how does the agent avoid bad fixes?",
      "Tag the release: git tag v1.0",
    ],
    commit: "release: v1.0",
    done: false, doneOn: null,
  },
];

// ─────────────────────────── helpers ───────────────────────────
const fs = require("fs");
const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const bar = (n, total, w = 28) =>
  "█".repeat(Math.round((n / total) * w)).padEnd(w, "░");

function show(t) {
  console.log(`\n  Day ${t.day} · Week ${t.week} · planned ${t.date}`);
  console.log(`  ${t.title}\n`);
  t.steps.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
  console.log(`\n  Commit: git commit -m "${t.commit}"`);
}

function summary() {
  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);
  console.log(`\n  SentinelOps — Akanksha's tracker`);
  console.log(`  ${bar(done, tasks.length)} ${done}/${tasks.length} (${pct}%)`);

  const next = tasks.find((t) => !t.done);
  if (!next) return console.log("\n  All done. Go win that leaderboard.\n");

  const late = dayDiff(next.date, today);
  const status =
    late > 0 ? `${late} day(s) behind — skip a Buffer day or check the cut list`
    : late < 0 ? `${-late} day(s) ahead`
    : "on track";
  console.log(`  Schedule: ${status}`);
  console.log(`\n  ── Today's task ──`);
  show(next);
  console.log(`\n  When finished: node tracker.js done ${next.day}\n`);
}

function listAll() {
  let week = 0;
  for (const t of tasks) {
    if (t.week !== week) console.log(`\n  Week ${(week = t.week)}`);
    const mark = t.done ? `✔ ${t.doneOn}` : "·";
    console.log(`   ${String(t.day).padStart(2)}  ${t.date}  ${t.title}  ${mark}`);
  }
  console.log();
}

function setDone(n, value) {
  const file = __filename;
  const src = fs.readFileSync(file, "utf8");
  const start = src.search(new RegExp(`\\{\\s*day: ${n},`));
  if (start === -1) return console.log(`  No task for day ${n}.`);
  const field = /done: (true|false), doneOn: (null|"[^"]*")/;
  const rest = src.slice(start).replace(
    field,
    value ? `done: true, doneOn: "${today}"` : "done: false, doneOn: null"
  );
  fs.writeFileSync(file, src.slice(0, start) + rest);
  console.log(`  Day ${n} marked ${value ? "done" : "not done"}.`);
  if (value) console.log(`  Now: git add -A && git commit && git push`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "all") listAll();
else if (cmd === "done" && arg) setDone(Number(arg), true);
else if (cmd === "undo" && arg) setDone(Number(arg), false);
else summary();
