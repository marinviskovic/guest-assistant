import { mkdirSync, writeFileSync } from "node:fs";
import { PROPERTY } from "../src/data/property.js";
import { todayIn } from "../src/lib/booking.js";
import type { ChatEvent } from "../server/assistant.js";
import { buildCases, type Reply } from "./cases.js";

/**
 * Runs the 30 eval cases against a running site and grades every reply.
 *
 *   npm run eval -- https://your-site.vercel.app
 *   npm run eval -- http://localhost:5173 --only booking,german
 *
 * Each case calls the real model, so a full run costs real money (well under $1).
 */

const args = process.argv.slice(2);
const base = (args.find((arg) => /^https?:\/\//.test(arg)) ?? process.env.EVAL_URL ?? "http://localhost:5173").replace(/\/$/, "");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ask(messages: { role: "user" | "assistant"; content: string }[]): Promise<Reply> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: base },
      body: JSON.stringify({ messages }),
    });
    // The site allows 30 questions per 10 minutes from one address; wait it out.
    if (response.status === 429 && attempt < 12) {
      console.log("  rate limited, waiting a minute");
      await sleep(60_000);
      continue;
    }
    const reply: Reply = { status: response.status, text: "", tools: [], notices: [] };
    if (!response.ok) {
      reply.notices.push(`http ${response.status}: ${await response.text()}`);
      return reply;
    }
    const body = await response.text();
    for (const line of body.split("\n").filter(Boolean)) {
      const event = JSON.parse(line) as ChatEvent;
      if (event.type === "text") reply.text += event.text;
      else if (event.type === "tool_start") reply.tools.push(event.name);
      else if (event.type === "booking") reply.booking = event.request;
      else if (event.type === "notice") reply.notices.push(event.code);
    }
    if (reply.notices.includes("busy") && attempt < 2) {
      await sleep(20_000);
      continue;
    }
    return reply;
  }
}

const today = todayIn(PROPERTY.timeZone);
const cases = buildCases(today).filter((item) => !only || only.includes(item.id));
console.log(`Running ${cases.length} cases against ${base} (today in ${PROPERTY.town}: ${today})\n`);

const results = [];
for (const item of cases) {
  const history: { role: "user" | "assistant"; content: string }[] = [];
  const replies: Reply[] = [];
  for (const turn of item.turns) {
    history.push({ role: "user", content: turn });
    const reply = await ask(history);
    replies.push(reply);
    history.push({ role: "assistant", content: reply.text || "(no answer)" });
  }
  const last = replies.at(-1)!;
  const checks = item.checks.map((check) => ({ name: check.name, pass: check.pass(last, replies) }));
  const passed = checks.every((check) => check.pass);
  results.push({ id: item.id, group: item.group, passed, checks, turns: item.turns, replies });

  console.log(`${passed ? "PASS" : "FAIL"} ${item.group.padEnd(8)} ${item.id}`);
  for (const check of checks.filter((check) => !check.pass)) console.log(`     missed: ${check.name}`);
  if (!passed) console.log(`     reply: ${last.text.replace(/\s+/g, " ").slice(0, 300)}${last.notices.length ? ` [${last.notices.join(", ")}]` : ""}`);
}

const groups = [...new Set(results.map((result) => result.group))];
console.log("\nBy group");
for (const group of groups) {
  const inGroup = results.filter((result) => result.group === group);
  console.log(`  ${group.padEnd(9)} ${inGroup.filter((result) => result.passed).length}/${inGroup.length}`);
}
const passed = results.filter((result) => result.passed).length;
console.log(`\n${passed}/${results.length} cases passed`);

mkdirSync("evals/results", { recursive: true });
const file = `evals/results/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify({ base, today, passed, total: results.length, results }, null, 2));
console.log(`Saved every reply to ${file}`);
process.exit(passed === results.length ? 0 : 1);
