import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  // This is a generic check, assuming the app runs.
  // Adjust based on actual app title if known, checking for vague match or just page load.
  await expect(page).toHaveTitle(/TimeTrack Pro/i);
});
