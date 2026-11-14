import { expect, test } from "@playwright/test";

import { getSessionCookie } from "./helpers";

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
