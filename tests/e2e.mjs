import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "vite";
import { startMock } from "./mock-anthropic.mjs";

/**
 * Browser checks for the chat widget against the mock Messages API.
 * Run: npm run test:e2e   (CHROMIUM_PATH can point at a local Chromium)
 */

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const mock = await startMock();
process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${mock.address().port}`;
process.env.ANTHROPIC_API_KEY = "test-key";

const vite = await createServer({ server: { port: 5199, strictPort: true }, logLevel: "error" });
await vite.listen();
const base = "http://localhost:5199";

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const shots = process.env.SCREENSHOTS;
if (shots) mkdirSync(shots, { recursive: true });
let failures = 0;

async function check(name, run) {
  try {
    await run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.log(`FAIL ${name}\n  ${error.message.split("\n")[0]}`);
  }
}

async function open(viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto(base);
  return { page, errors };
}

const lastReply = (page) => page.getByTestId("reply").last();

await check("a suggested question gets a streamed answer", async () => {
  const { page, errors } = await open({ width: 1366, height: 900 });
  await page.getByRole("button", { name: "Is parking included?" }).click();
  await assert.doesNotReject(lastReply(page).getByText("free reserved parking space").waitFor({ timeout: 10_000 }));
  assert.deepEqual(errors, []);
  await page.close();
});

await check("dates, then a booking request card with a WhatsApp link", async () => {
  const { page } = await open({ width: 1366, height: 900 });
  const box = page.getByLabel("Your question");
  await box.fill("Is Mare free in June for 4?");
  await box.press("Enter");
  await lastReply(page).getByText("Total:").waitFor({ timeout: 10_000 });
  assert.doesNotMatch(await lastReply(page).innerText(), /Need dates/); // thinking aloud before the tool is dropped
  await box.fill("Please book it, my name is Ana");
  await page.getByRole("button", { name: "Send" }).click();
  const card = page.getByRole("region", { name: "Booking request" });
  await card.waitFor({ timeout: 10_000 });
  const href = await card.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href");
  assert.match(href, /^https:\/\/wa\.me\/\?text=Booking%20request/);
  if (shots) await page.locator("#ask").screenshot({ path: `${shots}/chat-desktop.png` });

  await page.reload();
  await card.waitFor({ timeout: 5_000 }); // kept for the session
  await page.getByRole("button", { name: "New chat" }).click();
  assert.equal(await page.getByTestId("reply").count(), 0);
  await page.close();
});

await check("a German question is answered in German", async () => {
  const { page } = await open({ width: 1366, height: 900 });
  await page.getByRole("button", { name: "Wann ist der Check-in?" }).click();
  await lastReply(page).getByText("Schlüsselbox").waitFor({ timeout: 10_000 });
  await page.close();
});

await check("'Ask about dates' puts the question in the chat box", async () => {
  const { page } = await open({ width: 1366, height: 900 });
  await page.getByRole("button", { name: "Ask about dates" }).first().click();
  await page.waitForTimeout(600);
  const box = page.getByLabel("Your question");
  assert.equal(await box.inputValue(), "Is Studio Lanterna free from ");
  assert.equal(await box.evaluate((element) => element === document.activeElement), true);
  await page.close();
});

await check("phone layout has no sideways scrolling and the chat fits", async () => {
  const { page, errors } = await open({ width: 375, height: 740 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.equal(overflow, 0);
  if (shots) await page.screenshot({ path: `${shots}/home-phone.png`, fullPage: true });
  await page.locator("#ask").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Can we bring our dog?" }).click();
  await lastReply(page).locator("p").first().waitFor({ timeout: 10_000 });
  if (shots) await page.locator("#ask").screenshot({ path: `${shots}/chat-phone.png` });
  assert.deepEqual(errors, []);
  await page.close();
});

if (shots) {
  const { page } = await open({ width: 1366, height: 900 });
  await page.screenshot({ path: `${shots}/home-desktop.png`, fullPage: true });
  await page.close();
}

await browser.close();
await vite.close();
mock.close();
console.log(failures ? `\n${failures} failed` : "\nAll browser checks passed");
process.exit(failures ? 1 : 0);
