import { expect, test } from "@playwright/test";
import { Client } from "pg";

import { getSessionCookie, getSessionCookieFor } from "./helpers";

const PUBLIC_ROUTES = [
  "/",
  "/docs",
  "/verify/00000000-0000-0000-0000-000000000000",
  "/app",
  "/app/audits",
  "/app/attackers",
  "/app/reputation",
  "/app/settings/api-keys",
  "/operator/proprietary",
];

test("public routes render without horizontal page overflow", async ({ page }) => {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of PUBLIC_ROUTES) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} at ${width}`).toBe(200);
      const metrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(metrics.documentWidth, `${route} overflow at ${width}`).toBeLessThanOrEqual(
        metrics.viewportWidth + 1,
      );
    }
  }
});

test("app and docs content uses the global horizontal gutter at 1440x900", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const routes = [
    { route: "/app/reputation", screenshot: "test-results/gutter-reputation-1440.png" },
    { route: "/app/audits", screenshot: "test-results/gutter-audits-1440.png" },
    { route: "/docs", screenshot: "test-results/gutter-docs-1440.png" },
  ];

  for (const { route, screenshot } of routes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    const header = page.locator(".page-header").first();
    await expect(header, route).toBeVisible();
    const box = await header.boundingBox();
    expect(box, route).not.toBeNull();
    expect(box!.x, `${route} left gutter`).toBeGreaterThanOrEqual(24);
    expect(1440 - (box!.x + box!.width), `${route} right gutter`).toBeGreaterThanOrEqual(24);
    await page.screenshot({ path: screenshot, fullPage: false });
  }
});

test("unauthenticated operator route is gated", async ({ page }) => {
  const response = await page.goto("/operator", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /operator access/i })).toBeVisible();
  await expect(page.getByText("Live testnet runs")).toHaveCount(0);
});

test("wallet session sees live audits and can create a session-authenticated draft", async ({
  browser,
  baseURL,
}) => {
  const cookie = await getSessionCookie(baseURL!);
  test.skip(!cookie, "NEAR deployer key is not available for the signed-session E2E setup");

  const context = await browser.newContext();
  const host = new URL(baseURL!).hostname;
  await context.addCookies([
    {
      name: "dissent_session",
      value: cookie!,
      domain: host,
      path: "/",
      httpOnly: true,
      secure: baseURL!.startsWith("https"),
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();

  await page.goto("/app/audits", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /every thesis/i })).toBeVisible();

  await page.goto("/app/audits/new", { waitUntil: "domcontentloaded" });
  const title = `E2E draft ${Date.now()}`;
  await page.getByLabel("Audit title").fill(title);
  await page
    .getByLabel("Thesis rationale")
    .fill(
      "A deterministic end-to-end draft used to verify session-scoped audit creation without claiming a live trade.",
    );
  await page.getByRole("button", { name: /create draft in console/i }).click();
  await expect(page.getByRole("heading", { name: /draft created/i })).toBeVisible();
  await expect(page.getByText("Public audit ID")).toBeVisible();

  await page.goto("/operator", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Recent runs" })).toBeVisible();
  await expect(page.getByText("Operator-only surface").first()).toBeVisible();

  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ width, height });
    const response = await page.goto("/operator/proprietary", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /originate/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Venue precheck" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Execution path" })).toBeVisible();
    await expect(page.getByText(/vault tx:/)).toBeVisible();
    await expect(page.getByText("EXECUTED").first()).toBeVisible();
    const metrics = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  }

  await context.close();
});

test("TRADE audit exposes client execution via the venue quote", async ({ browser, baseURL }) => {
  const cookie = await getSessionCookieFor(
    baseURL!,
    process.env.DEMO_CLIENT_ACCOUNT_ID,
    process.env.DEMO_CLIENT_KEY,
  );
  test.skip(!cookie, "DEMO_CLIENT_KEY is not available for the client execution E2E setup");

  const context = await browser.newContext();
  const host = new URL(baseURL!).hostname;
  await context.addCookies([
    {
      name: "dissent_session",
      value: cookie!,
      domain: host,
      path: "/",
      httpOnly: true,
      secure: baseURL!.startsWith("https"),
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  const tradeAuditId = "0bf3728d-e457-4b2f-8fad-b53be9565498";

  await page.goto(`/app/audits/${tradeAuditId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("execute-trade")).toBeVisible();
  await expect(page.getByText(/Dissent audits the thesis/i).first()).toBeVisible();

  let quoteResponse = await page.request.post(
    `${baseURL}/api/v1/ui/audits/${tradeAuditId}/execution/quote`,
    { headers: { cookie: `dissent_session=${cookie}` } },
  );
  for (let attempt = 1; attempt < 3 && quoteResponse.status() !== 200; attempt += 1) {
    await page.waitForTimeout(2_000);
    quoteResponse = await page.request.post(
      `${baseURL}/api/v1/ui/audits/${tradeAuditId}/execution/quote`,
      { headers: { cookie: `dissent_session=${cookie}` } },
    );
  }
  expect(quoteResponse.status()).toBe(200);
  const quote = await quoteResponse.json();
  expect(quote.venue).toBe("TIDEPOOL");
  expect(quote.pay.amount_yocto).toBe("10000000000000000000000");
  expect(quote.quote.deposit_address).toMatch(/^[0-9a-f]{64}$/);

  await context.close();
});

test("new audit form exposes wallet commit and fund steps", async ({ browser, baseURL }) => {
  const cookie = await getSessionCookieFor(
    baseURL!,
    process.env.DEMO_CLIENT_ACCOUNT_ID,
    process.env.DEMO_CLIENT_KEY,
  );
  test.skip(!cookie, "DEMO_CLIENT_KEY is not available for the client signing E2E setup");

  const context = await browser.newContext();
  const host = new URL(baseURL!).hostname;
  await context.addCookies([
    {
      name: "dissent_session",
      value: cookie!,
      domain: host,
      path: "/",
      httpOnly: true,
      secure: baseURL!.startsWith("https"),
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  let auditId: string | null = null;

  try {
    await page.goto("/app/audits/new", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Audit title").fill(`E2E client signing ${Date.now()}`);
    const [prepareResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/ui/audits/prepare") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: /create draft in console/i }).click(),
    ]);
    expect(prepareResponse.status()).toBe(201);
    const prepared = await prepareResponse.json();
    auditId = prepared.audit_id as string;

    await expect(page.getByTestId("sign-commitment")).toBeVisible();
    await expect(page.getByText(/Sign fund_audit/i)).toBeVisible();
    await expect(page.getByText(/Dissent audits the thesis/i).first()).toBeVisible();
  } finally {
    await context.close();
    if (auditId && process.env.DATABASE_URL) {
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      await client.query(
        "delete from audits where id=$1 and status='AWAITING_COMMITMENT' and not exists (select 1 from commitments where audit_id=audits.id)",
        [auditId],
      );
      await client.end();
    }
  }
});

test("hero phone is visible at 1440x900 and hidden on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const phone = page.locator(".hero-phone");
  await expect(phone).toBeVisible();
  const box = await phone.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(240);
  expect(box!.x).toBeGreaterThan(800);
  await page.screenshot({ path: "test-results/hero-1440.png", fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(phone).toBeHidden();
});
