import { expect, test } from "@playwright/test";

test("landing v2 presents the full marketing mockup without dead controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/landing-v2", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  await expect(
    page.getByRole("heading", { level: 1, name: /don't let the agent grade itself/i }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: /launch app/i }).first()).toHaveAttribute(
    "href",
    "/app",
  );
  await expect(page.getByRole("link", { name: /read the docs/i }).first()).toHaveAttribute(
    "href",
    "/docs",
  );

  await expect(page.locator(".lv2-attacker")).toHaveCount(8);
  for (const id of ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08"]) {
    await expect(page.getByText(id, { exact: true }).first()).toBeVisible();
  }

  await expect(page.getByText("Agent wallet", { exact: true })).toBeVisible();
  await expect(page.getByText("Facilitator", { exact: true })).toBeVisible();
  await expect(page.getByText("OpenRouter", { exact: true })).toBeVisible();
  await expect(page.getByText("Groq", { exact: true })).toBeVisible();

  const howItWorks = page.locator("#how-it-works");
  await expect(howItWorks.getByText("Connect wallet", { exact: true })).toBeVisible();
  await expect(howItWorks.getByText("The audit", { exact: true })).toBeVisible();
  await expect(howItWorks.getByText("The verdict", { exact: true })).toBeVisible();

  const footer = page.locator(".lv2-footer");
  await expect(footer.getByRole("link", { name: /github/i })).toHaveAttribute(
    "href",
    "https://github.com/onyebuchidaniel60/dissent",
  );
  await expect(footer.getByRole("link", { name: /documentation/i })).toHaveAttribute(
    "href",
    "/docs",
  );
  await expect(footer.getByRole("link", { name: /public verifier/i })).toHaveAttribute(
    "href",
    /^\/verify\//,
  );
  await expect(footer.getByRole("link", { name: /x \(twitter\)/i })).toHaveAttribute(
    "href",
    /^https:\/\/x\.com\//,
  );

  const links = page.locator('a[href="#"]');
  await expect(links).toHaveCount(0);

  await page.screenshot({ path: "test-results/landing-v2-1440.png", fullPage: true });
});

test("landing v2 stacks cleanly on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/landing-v2", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".lv2-attacker")).toHaveCount(8);
  await expect(page.locator(".lv2-phone-stage")).toBeHidden();

  await page.screenshot({ path: "test-results/landing-v2-390.png", fullPage: true });
});
