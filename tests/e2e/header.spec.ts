import { expect, test } from "@playwright/test";

const APP_LOGO_ROUTES = [
  "/app",
  "/app/audits",
  "/app/audits/new",
  "/operator",
  "/operator/proprietary",
];

const MARKETING_LOGO_ROUTES = [
  "/docs",
  "/verify/00000000-0000-0000-0000-000000000000",
  "/old-home",
];

test("global header logo is context-aware across app and marketing routes", async ({ page }) => {
  for (const route of APP_LOGO_ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".site-header .brand"), route).toHaveAttribute("href", "/app");
  }

  for (const route of MARKETING_LOGO_ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".site-header .brand"), route).toHaveAttribute("href", "/");
  }

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".lv2-nav .brand")).toHaveAttribute("href", "/");
});

test("clicking the logo keeps app users in the app and marketing users on the site", async ({
  page,
}) => {
  await page.goto("/app/audits", { waitUntil: "domcontentloaded" });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/app");
  await expect(page.getByRole("heading", { name: /the thesis under attack/i })).toBeVisible();

  await page.goto("/operator", { waitUntil: "domcontentloaded" });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/app");

  await page.goto("/docs", { waitUntil: "domcontentloaded" });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.locator(".lv2-page")).toBeVisible();

  await page.goto("/verify/00000000-0000-0000-0000-000000000000", {
    waitUntil: "domcontentloaded",
  });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.locator(".lv2-page")).toBeVisible();
});
