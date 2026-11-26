import { expect, test } from '@playwright/test';

// Job 1: handle a tool request. Covers the decline path (2.2 → 2.7 → 2.8 → 2.9) on a phone,
// and the full approve + record purchase path (2.2 → 2.3 → 2.4 → 2.5a → 2.6 → 1.2) on desktop.

test.beforeEach(async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('declining a request leaves spend unchanged and empties the list', async ({ page }) => {
  await page.getByRole('link', { name: /Review 1 pending request/ }).click();
  await page.getByRole('link', { name: /ChatGPT Team/ }).click();

  await page.getByRole('button', { name: 'Decline', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Decline this request?' });
  await expect(sheet).toBeVisible();
  await sheet.getByLabel('Reason (optional)').fill('Let’s revisit next quarter.');
  await sheet.getByRole('button', { name: 'Decline request' }).click();

  await expect(page.getByRole('heading', { name: 'Request declined' })).toBeVisible();
  await expect(page.getByText('No purchase was made and spend is unchanged.')).toBeVisible();
  await page.getByRole('link', { name: 'Back to requests' }).click();

  await expect(page.getByRole('heading', { name: 'You’re all caught up' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to overview' }).click();
  await expect(page.getByText('€99.00', { exact: true })).toBeVisible();
  await expect(page.getByText('Nothing waiting')).toBeVisible();
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('approve and record a purchase from the sidebar', async ({ page }) => {
    const sidebar = page.getByRole('navigation', { name: 'Main' });
    await expect(sidebar.getByText('1 pending')).toBeAttached();
    await sidebar.getByRole('link', { name: /Requests/ }).click();
    await page.getByRole('link', { name: /ChatGPT Team/ }).click();

    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Request approved' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to purchase' }).click();

    await expect(page.getByRole('heading', { name: 'Ready to purchase' })).toBeVisible();
    await page.getByRole('button', { name: 'Record purchase', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Record the purchase' });
    await sheet.getByLabel('Amount paid (€)').fill('');
    await sheet.getByRole('button', { name: 'Confirm purchase' }).click();
    await expect(sheet.getByText('Enter the amount you paid.')).toBeVisible(); // frame 2.5a

    await sheet.getByLabel('Amount paid (€)').fill('30');
    await sheet.getByRole('button', { name: 'Confirm purchase' }).click();
    await expect(page.getByRole('heading', { name: 'Purchase recorded' })).toBeVisible();
    await expect(page.getByText('€129.00', { exact: true })).toBeVisible();
    await expect(page.getByText('Dec 5, 2026')).toBeVisible();

    await sidebar.getByRole('link', { name: 'Overview' }).click();
    await expect(page.getByText('€129.00', { exact: true })).toBeVisible(); // frame 1.2
    await expect(page.getByText('€1,548.00 annualized')).toBeVisible();
    await expect(page.getByText('2 tools across your company')).toBeVisible();
    await expect(sidebar.getByText('1 pending')).toHaveCount(0);
  });
});
