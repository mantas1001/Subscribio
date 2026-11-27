import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Microsoft Clarity behind a consent banner (auth build, VITE_CLARITY_PROJECT_ID=test-clarity).
// Requests to clarity.ms are answered locally with an empty script, so window.clarity.q keeps
// every call the app made.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

async function watchClarity(page: import('@playwright/test').Page) {
  const loads: string[] = [];
  await page.route('https://www.clarity.ms/**', (route) => {
    loads.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  return loads;
}

test('asks before loading Clarity; "No thanks" loads nothing and is remembered', async ({ page }) => {
  const loads = await watchClarity(page);
  await page.goto('/#/');
  const banner = page.getByRole('region', { name: 'Help improve Subscribio?' });
  await expect(banner).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);

  await banner.getByRole('button', { name: 'No thanks' }).click();
  await expect(banner).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Help improve Subscribio?' })).toHaveCount(0);
  expect(loads).toEqual([]);
});

test('"Allow" loads Clarity with analytics consent, and again on the next visit', async ({ page }) => {
  const loads = await watchClarity(page);
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Allow' }).click();
  await expect.poll(() => loads.length).toBe(1);
  expect(loads[0]).toBe('https://www.clarity.ms/tag/test-clarity');
  const calls = await page.evaluate(() => (window.clarity?.q ?? []).map((args) => args[0]));
  expect(calls).toContain('consentv2');

  await page.reload();
  await expect.poll(() => loads.length).toBe(2);
  await expect(page.getByRole('region', { name: 'Help improve Subscribio?' })).toHaveCount(0);
});
