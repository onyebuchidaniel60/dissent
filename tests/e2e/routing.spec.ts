import { expect, test } from "@playwright/test";

test("root cookie routing sets dissent_visited and redirects returning visits", async ({
  context,
  page,
  baseURL,
}) => {
  await context.clearCookies();

  const first = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(first?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/");
  await expect(page.locator(".lv2-page")).toBeVisible();

  const cookie = (await context.cookies()).find((item) => item.name === "dissent_visited");
  expect(cookie?.value).toBe("true");
  expect(cookie?.path).toBe("/");

  if (cookie?.expires && cookie.expires > 0) {
    const remainingDays = (cookie.expires * 1000 - Date.now()) / 86_400_000;
    expect(remainingDays).toBeGreaterThan(29);
    expect(remainingDays).toBeLessThan(31);
  }

  const redirect = await page.request.get("/", { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  const location = redirect.headers()["location"];
  expect(location, "redirect location").toBeTruthy();
  expect(new URL(location, baseURL).pathname).toBe("/home");

  await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(new URL(page.url()).pathname).toBe("/home");
  await expect(page.locator(".site-header")).toBeVisible();
});

test("middleware does not intercept app, API, health or verifier routes", async ({
  context,
  page,
  baseURL,
}) => {
  await context.clearCookies();
  await context.addCookies([
    {
      name: "dissent_visited",
      value: "true",
      url: baseURL!,
    },
  ]);

  const appResponse = await page.goto("/app", { waitUntil: "domcontentloaded" });
  expect(appResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /the thesis under attack/i })).toBeVisible();

  const newAuditResponse = await page.goto("/app/audits/new", {
    waitUntil: "domcontentloaded",
  });
  expect(newAuditResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /define the failure/i })).toBeVisible();

  const verifierResponse = await page.goto(
    "/verify/0bf3728d-e457-4b2f-8fad-b53be9565498",
    { waitUntil: "domcontentloaded" },
  );
  expect(verifierResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /check the record/i })).toBeVisible();
  await expect(page.getByText(/VERIFIED/i).first()).toBeVisible();

  const auditsApi = await page.request.get("/api/v1/audits", { maxRedirects: 0 });
  expect(auditsApi.status()).toBe(401);
  const auditsBody = await auditsApi.json();
  expect(auditsBody.error.code).toBe("UNAUTHENTICATED");

  const sessionApi = await page.request.get("/api/v1/auth/session", { maxRedirects: 0 });
  expect(sessionApi.status()).toBe(200);
  const sessionBody = await sessionApi.json();
  expect(sessionBody.authenticated).toBe(false);

  const supportedApi = await page.request.get("/api/x402/supported", { maxRedirects: 0 });
  expect(supportedApi.status()).toBe(200);
  const supportedBody = await supportedApi.json();
  expect(supportedBody.enabled).toBe(true);

  for (const [route, expected] of [
    ["/healthz", "ok"],
    ["/readyz", "ready"],
  ] as const) {
    const response = await page.request.get(route, { maxRedirects: 0 });
    expect(response.status(), route).toBe(200);
    expect(response.headers()["location"], route).toBeUndefined();
    const body = await response.json();
    expect(body.status, route).toBe(expected);
  }
});

test("/old-home permanently redirects to /home", async ({ context, page, baseURL }) => {
  await context.clearCookies();
  const response = await page.request.get("/old-home", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  const location = response.headers()["location"];
  expect(location, "redirect location").toBeTruthy();
  expect(new URL(location, baseURL).pathname).toBe("/home");

  await page.goto("/old-home", { waitUntil: "domcontentloaded" });
  expect(new URL(page.url()).pathname).toBe("/home");
  await expect(page.locator(".site-header")).toBeVisible();
});
