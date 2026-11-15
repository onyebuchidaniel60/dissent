import { expect, test } from "@playwright/test";

test("promoted homepage presents the full marketing page and routes to the app", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  await expect(
    page.getByRole("heading", { level: 1, name: /don't let the agent grade itself/i }),
  ).toBeVisible();

  await expect(page.locator(".lv2-attacker")).toHaveCount(8);
  for (const id of ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08"]) {
    await expect(page.locator(".lv2-attacker").getByText(id, { exact: true }).first()).toBeVisible();
  }

  await expect(page.getByText("Agent wallet", { exact: true })).toBeVisible();
  await expect(page.getByText("Facilitator", { exact: true })).toBeVisible();
  await expect(page.getByText("OpenRouter", { exact: true })).toBeVisible();
  await expect(page.getByText("Groq", { exact: true })).toBeVisible();

  const howItWorks = page.locator("#how-it-works");
  await expect(howItWorks.getByText("Connect wallet", { exact: true })).toBeVisible();
  await expect(howItWorks.getByText("The audit", { exact: true })).toBeVisible();
  await expect(howItWorks.getByText("The verdict", { exact: true })).toBeVisible();
  await expect(howItWorks.getByText(/evidence is re-fetched before adjudication/i)).toBeVisible();

  const wallet = page.locator(".lv2-x402-wallet");
  await expect(wallet.getByText("x402-agent.testnet", { exact: true })).toBeVisible();
  await expect(wallet.locator(".lv2-x402-wallet-balance")).toContainText(/USDC/);
  await expect(wallet.getByRole("link", { name: /explorer/i })).toHaveAttribute(
    "href",
    /nearblocks\.io\/address\/x402-agent\.testnet/,
  );

  const demoLink = page.getByRole("link", { name: /watch the demo/i }).first();
  await expect(demoLink).toHaveAttribute("href", /demo\/dissent-demo\.mp4/);

  const verify = page.locator("#verify");
  const certificateLinks = verify.getByRole("link", { name: /open public verifier/i });
  await expect(certificateLinks).toHaveCount(2);
  const hrefs = await certificateLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  for (const href of hrefs) {
    expect(href).toMatch(/^\/verify\/[0-9a-f-]+$/);
    const verifyResponse = await page.request.get(`${baseURL}${href}`);
    expect(verifyResponse.status(), href!).toBe(200);
  }

  const launchLink = page.getByRole("link", { name: /launch app/i }).first();
  await expect(launchLink).toHaveAttribute("href", "/app");
  await launchLink.click();
  await page.waitForURL("**/app");
  await expect(page.getByRole("heading", { name: /the thesis under attack/i })).toBeVisible();

  await page.goto("/app/audits/new", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /define the failure/i })).toBeVisible();
  await expect(page.getByLabel("Audit title")).toBeVisible();

  await page.goto("/", { waitUntil: "domcontentloaded" });
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

  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".footer")).toHaveCount(0);

  await page.screenshot({ path: "test-results/homepage-1440.png", fullPage: true });
});

test("promoted homepage stacks cleanly on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".lv2-attacker")).toHaveCount(8);
  await expect(page.locator(".lv2-phone-stage")).toBeHidden();
  await expect(page.getByRole("link", { name: /launch app/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /watch the demo/i }).first()).toBeVisible();

  await page.screenshot({ path: "test-results/homepage-390.png", fullPage: true });
});

test("legacy homepage remains available at /old-home", async ({ page }) => {
  const response = await page.goto("/old-home", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/don't let/i);
  await expect(page.locator(".site-header")).toHaveCount(1);
  await expect(page.locator(".footer")).toHaveCount(1);
  await expect(page.locator(".lv2-footer")).toHaveCount(0);
  await expect(page.locator(".hero-phone")).toBeVisible();
});

test("/landing-v2 redirects to the promoted homepage", async ({ page }) => {
  await page.goto("/landing-v2", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".lv2-page")).toBeVisible();
});
