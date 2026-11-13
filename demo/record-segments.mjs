import { chromium } from "@playwright/test";
import { serialize } from "borsh";
import { KeyPair } from "near-api-js";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

try { process.loadEnvFile(".env.local"); } catch {}

const base = process.env.DEMO_BASE_URL ?? "http://localhost:3100";
const accountId = process.env.NEAR_DEPLOYER_ACCOUNT_ID;
const privateKey = process.env.NEAR_DEPLOYER_KEY;
const timings = JSON.parse(readFileSync("demo/timings.json", "utf8"));
const byId = Object.fromEntries(timings.segments.map((s) => [s.id, s]));

const PREFIX = 2147484061;
const SCHEMA = { struct: { message: "string", nonce: { array: { type: "u8", len: 32 } }, recipient: "string", callbackUrl: { option: "string" } } };

async function sessionCookie() {
  if (!accountId || !privateKey) return null;
  const res = await fetch(`${base}/api/v1/auth/nonce`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountId }) });
  const c = await res.json();
  const nonce = Buffer.from(c.nonce, "base64");
  const prefix = Buffer.alloc(4); prefix.writeUInt32LE(PREFIX, 0);
  const params = serialize(SCHEMA, { message: c.message, nonce, recipient: c.recipient, callbackUrl: c.callbackUrl });
  const digest = createHash("sha256").update(Buffer.concat([prefix, Buffer.from(params)])).digest();
  const kp = KeyPair.fromString(privateKey); const sig = kp.sign(digest);
  const v = await fetch(`${base}/api/v1/auth/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountId, publicKey: kp.getPublicKey().toString(), signature: Buffer.from(sig.signature).toString("base64"), nonce: c.nonce }) });
  const cookie = v.headers.get("set-cookie");
  return cookie?.split(";")[0].split("=")[1] ?? null;
}

const cookie = await sessionCookie();
const browser = await chromium.launch({ headless: true });

async function record(id, path, prepare, duration) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: "/tmp/opencode/demo-segments", size: { width: 1280, height: 720 } },
    reducedMotion: "reduce",
  });
  if (cookie) await context.addCookies([{ name: "dissent_session", value: cookie, domain: new URL(base).hostname, path: "/", httpOnly: true, secure: base.startsWith("https"), sameSite: "Lax" }]);
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
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await prepare(page);
  await page.waitForTimeout(duration * 1000 + 1200);
  const video = page.video();
  await context.close();
  console.log(id, await video?.path());
}

const live = "/app/audits/394c2192-8d9f-4463-99f2-a15d45dc54a2";
const op = "/operator/audits/394c2192-8d9f-4463-99f2-a15d45dc54a2";
const fixture = "/app/audits/demo-audit-001/results";
const scroll = async (p, text) => {
  const heading = p.getByRole("heading", { name: text });
  if ((await heading.count()) > 0) {
    await heading.first().scrollIntoViewIfNeeded().catch(() => {});
    return;
  }
  await p.getByText(text, { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
};

await record("S1", "/", async (page) => { await page.mouse.move(620, 480, { steps: 12 }); }, byId.S1.duration);
await record("S2", "/", async (page) => { await page.mouse.wheel(0, 720); await scroll(page, "An argument with receipts"); await page.mouse.move(650, 420, { steps: 12 }); }, byId.S2.duration);
await record("S3", live, async (page) => { await scroll(page, "Committed conditions"); await page.mouse.move(520, 420, { steps: 12 }); }, byId.S3.duration);
await record("S4", "/app/attackers", async (page) => { await scroll(page, "Pinned assignments"); await page.mouse.move(620, 420, { steps: 12 }); }, byId.S4.duration);
await record("S5", live, async (page) => { await scroll(page, "Findings"); await page.mouse.move(520, 480, { steps: 12 }); }, byId.S5.duration);
await record("S6", op, async (page) => { await scroll(page, "Adjudication"); await page.mouse.move(600, 440, { steps: 12 }); }, byId.S6.duration);
await record("S7", fixture, async (page) => { await scroll(page, "Condition coverage"); await page.mouse.move(600, 480, { steps: 12 }); }, byId.S7.duration);
await record("S8", op, async (page) => { await scroll(page, "Bounty accounting"); await page.mouse.move(560, 520, { steps: 12 }); }, byId.S8.duration);

await browser.close();
