import { expect, test } from "@playwright/test";

const APP_LOGO_ROUTES = [
  "/app",
  "/app/audits",
  "/app/audits/new",
  "/operator",
  "/operator/proprietary",
];

const MARKETING_LOGO_ROUTES = ["/home", "/docs", "/verify/00000000-0000-0000-0000-000000000000"];

test("global header logo is context-aware across app and marketing routes", async ({ page }) => {
  for (const route of APP_LOGO_ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const logo = page.locator(".site-header .brand");
    await expect(logo, route).toHaveAttribute("href", "/home");
    await expect(logo, route).toHaveAttribute("aria-label", "Dissent home");
  }

  for (const route of MARKETING_LOGO_ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const logo = page.locator(".site-header .brand");
    await expect(logo, route).toHaveAttribute("href", "/");
    await expect(logo, route).toHaveAttribute("aria-label", "Dissent marketing");
  }

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".lv2-nav .brand")).toHaveAttribute("href", "/");
});

test("clicking the logo sends app users home and marketing users to the landing page", async ({
  page,
}) => {
  await page.goto("/app/audits", { waitUntil: "domcontentloaded" });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/home");
  await expect(page.locator(".site-header")).toBeVisible();

  await page.goto("/operator", { waitUntil: "domcontentloaded" });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/home");

  await page.goto("/docs", { waitUntil: "domcontentloaded" });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.locator(".lv2-page")).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/home", { waitUntil: "domcontentloaded" });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.locator(".lv2-page")).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/verify/00000000-0000-0000-0000-000000000000", {
    waitUntil: "domcontentloaded",
  });
  await page.locator(".site-header .brand").click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.locator(".lv2-page")).toBeVisible();
});
