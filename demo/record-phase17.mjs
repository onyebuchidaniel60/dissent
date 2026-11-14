import { chromium } from "@playwright/test";
import { serialize } from "borsh";
import { KeyPair } from "near-api-js";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

try { process.loadEnvFile(".env.local"); } catch {}

const base = process.env.DEMO_BASE_URL ?? "http://localhost:3200";
const timings = JSON.parse(readFileSync("demo/timings.json", "utf8"));
const byId = Object.fromEntries(timings.segments.map((s) => [s.id, s]));
const OUT = "/tmp/opencode/phase17-segments";
mkdirSync(OUT, { recursive: true });

const PREFIX = 2147484061;
const SCHEMA = { struct: { message: "string", nonce: { array: { type: "u8", len: 32 } }, recipient: "string", callbackUrl: { option: "string" } } };

async function session(accountId, privateKey) {
  const res = await fetch(`${base}/api/v1/auth/nonce`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountId }) });
  const c = await res.json();
  const nonce = Buffer.from(c.nonce, "base64");
  const prefix = Buffer.alloc(4); prefix.writeUInt32LE(PREFIX, 0);
  const params = serialize(SCHEMA, { message: c.message, nonce, recipient: c.recipient, callbackUrl: c.callbackUrl });
  const digest = createHash("sha256").update(Buffer.concat([prefix, Buffer.from(params)])).digest();
  const kp = KeyPair.fromString(privateKey); const sig = kp.sign(digest);
  const v = await fetch(`${base}/api/v1/auth/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountId, publicKey: kp.getPublicKey().toString(), signature: Buffer.from(sig.signature).toString("base64"), nonce: c.nonce }) });
  return v.headers.get("set-cookie")?.split(";")[0].split("=")[1] ?? null;
}

const adminCookie = await session(process.env.NEAR_DEPLOYER_ACCOUNT_ID, process.env.NEAR_DEPLOYER_KEY);
const clientCookie = await session(process.env.DEMO_CLIENT_ACCOUNT_ID, process.env.DEMO_CLIENT_KEY);

const browser = await chromium.launch({ headless: true });
const results = [];

async function smoothScroll(page, targetY, duration = 900) {
  await page.evaluate(async ({ targetY, duration }) => {
    const startY = window.scrollY;
    const start = performance.now();
    await new Promise((resolve) => {
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        window.scrollTo(0, startY + (targetY - startY) * eased);
        if (t < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }, { targetY, duration });
}

async function scrollToElement(page, locator, offset = 220, duration = 900) {
  await locator.first().waitFor({ state: "attached", timeout: 30000 });
  const box = await locator.first().boundingBox().catch(() => null);
  if (!box) return;
  const current = await page.evaluate(() => window.scrollY);
  await smoothScroll(page, Math.max(0, current + box.y - offset), duration);
}

async function record(id, target, url, cookie, action) {
  const contextStart = Date.now();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
    reducedMotion: "reduce",
  });
  if (cookie) {
    await context.addCookies([{ name: "dissent_session", value: cookie, domain: new URL(base).hostname, path: "/", httpOnly: true, secure: base.startsWith("https"), sameSite: "Lax" }]);
  }
  const page = await context.newPage();
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = `.dissent-demo-cursor{position:fixed;z-index:2147483647;width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #fff;border-radius:50%;background:#FE201F;box-shadow:0 0 0 4px rgba(254,32,31,.22),0 4px 18px rgba(0,0,0,.35);pointer-events:none;transition:transform 80ms linear}.dissent-demo-cursor[data-down="true"]{transform:scale(.72)}`;
    document.documentElement.appendChild(style);
    const dot = document.createElement("div"); dot.className = "dissent-demo-cursor"; dot.style.left = "50%"; dot.style.top = "50%"; document.documentElement.appendChild(dot);
    window.addEventListener("mousemove", (e) => { dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`; });
    window.addEventListener("mousedown", () => dot.setAttribute("data-down", "true"));
    window.addEventListener("mouseup", () => dot.setAttribute("data-down", "false"));
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2500);
  const actionStart = Date.now();
  if (action) await action(page);
  await page.waitForTimeout(target * 1000 + 800);
  const video = page.video();
  const path = await video.path();
  await context.close();
  const trimMs = Math.max(0, actionStart - contextStart - 200);
  results.push({ id, file: path, trimMs, duration: target });
  console.log(id, path, "trim", trimMs, "target", target);
}

const cards = "file:///tmp/opencode/phase17-cards";
const t = (id) => byId[id].duration + (id === "S12" ? timings.outro : timings.gap);

await record("S0", 1.5, `${cards}/title.html`, null, null);

await record("S1", t("S1"), `${base}/`, null, async (page) => {
  await page.mouse.move(980, 340, { steps: 24 });
  await page.waitForTimeout(600);
  await page.mouse.move(1120, 300, { steps: 20 });
});

await record("S2", t("S2"), `${base}/app/audits/new`, clientCookie, async (page) => {
  const create = page.getByRole("button", { name: /create draft in console/i });
  await scrollToElement(page, create, 300, 900);
  await page.waitForTimeout(400);
  await page.mouse.move(470, 760, { steps: 20 });
  await create.click();
  await page.waitForTimeout(2600);
  await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));
  const sign = page.getByTestId("sign-commitment");
  await scrollToElement(page, sign, 360, 1000);
  await page.waitForTimeout(500);
  await sign.hover().catch(() => {});
});

await record("S3", t("S3"), `${base}/app/audits/88114e6f-0cc7-479d-af0a-49425b9f3ea5`, clientCookie, async (page) => {
  await scrollToElement(page, page.getByRole("heading", { name: "Attacker runs" }), 250, 1000);
  await page.mouse.move(560, 540, { steps: 20 });
  await page.waitForTimeout(900);
  await smoothScroll(page, 520, 1400);
  await page.mouse.move(780, 470, { steps: 18 });
});

await record("S4", t("S4"), `${base}/app/attackers`, clientCookie, async (page) => {
  await scrollToElement(page, page.getByText(/Pinned assignments/i), 200, 1000);
  await page.mouse.move(480, 470, { steps: 18 });
  await page.waitForTimeout(1200);
  await smoothScroll(page, 760, 1400);
  await page.mouse.move(980, 560, { steps: 18 });
});

await record("S5", t("S5"), `${cards}/x402.html`, null, async (page) => {
  await page.mouse.move(700, 590, { steps: 22 });
  await page.waitForTimeout(1400);
  await page.mouse.move(1010, 470, { steps: 18 });
});

await record("S5B", t("S5B"), `${cards}/agent-economy.html`, null, async (page) => {
  await page.mouse.move(560, 560, { steps: 18 });
  await page.waitForTimeout(900);
  await page.mouse.move(960, 540, { steps: 18 });
});

await record("S6", t("S6"), `${base}/app/audits/88114e6f-0cc7-479d-af0a-49425b9f3ea5/results`, clientCookie, async (page) => {
  await scrollToElement(page, page.getByRole("heading", { name: "Findings" }), 220, 1100);
  await page.mouse.move(540, 520, { steps: 18 });
  await page.waitForTimeout(1200);
  await smoothScroll(page, 1160, 1800);
  await page.mouse.move(860, 480, { steps: 16 });
});

await record("S7", t("S7"), `${base}/app/audits/88114e6f-0cc7-479d-af0a-49425b9f3ea5`, clientCookie, async (page) => {
  await page.mouse.move(690, 520, { steps: 20 });
  await page.waitForTimeout(800);
  await page.mouse.move(1140, 410, { steps: 20 });
});

await record("S8", t("S8"), `${base}/verify/a8df6a5a-8b3c-4f33-9953-4b64593256bf`, null, async (page) => {
  await page.mouse.move(520, 520, { steps: 20 });
  await page.waitForTimeout(1000);
  await page.mouse.move(900, 470, { steps: 18 });
});

await record("S9", t("S9"), `${base}/operator/proprietary`, adminCookie, async (page) => {
  await scrollToElement(page, page.getByRole("heading", { name: "Execution receipts" }), 210, 1100);
  await page.mouse.move(520, 650, { steps: 20 });
  await page.waitForTimeout(1300);
  await smoothScroll(page, 700, 1600);
  await page.mouse.move(1040, 760, { steps: 18 });
});

await record("S10", t("S10"), `${base}/verify/0bf3728d-e457-4b2f-8fad-b53be9565498`, null, async (page) => {
  await smoothScroll(page, 120, 700);
  await page.mouse.move(760, 430, { steps: 18 });
  await page.waitForTimeout(1000);
  await smoothScroll(page, 420, 1200);
  await page.mouse.move(1130, 730, { steps: 18 });
});

await record("S11", t("S11"), `${base}/verify/0bf3728d-e457-4b2f-8fad-b53be9565498`, null, async (page) => {
  await page.mouse.move(600, 330, { steps: 18 });
  await page.waitForTimeout(700);
  await page.mouse.move(940, 620, { steps: 18 });
});

await record("S12", t("S12"), `${cards}/closing.html`, null, async (page) => {
  await page.mouse.move(820, 520, { steps: 18 });
});

writeFileSync("demo/phase17-segments.json", JSON.stringify(results, null, 2) + "\n");
await browser.close();
console.log("done", results.length);
