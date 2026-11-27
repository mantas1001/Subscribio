import { expect, test } from '@playwright/test';

// Microsoft Clarity starts automatically (auth build, VITE_CLARITY_PROJECT_ID=test-clarity).
// Requests to clarity.ms are answered locally with an empty script, so window.clarity.q keeps
// every call the app made.

test('Clarity starts on every visit without asking', async ({ page }) => {
  const loads: string[] = [];
  await page.route('https://www.clarity.ms/**', (route) => {
    loads.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
  await expect.poll(() => loads).toEqual(['https://www.clarity.ms/tag/test-clarity']);
  await expect(page.getByRole('button', { name: 'Allow' })).toHaveCount(0);
  const calls = await page.evaluate(() => (window.clarity?.q ?? []).map((args) => args[0]));
  expect(calls).toContain('consentv2');
});
