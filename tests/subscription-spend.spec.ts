import { expect, test } from '@playwright/test';

test('cancelling a subscription preserves other purchases after reload', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('link', { name: /Review 1 pending request/ }).click();
  await page.getByRole('link', { name: /ChatGPT Team/ }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByRole('link', { name: 'Go to purchase' }).click();
  await page.getByRole('button', { name: 'Record purchase', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm purchase' }).click();
  await page.getByRole('link', { name: 'Back to overview' }).click();

  await expect(page.getByText('€129.00', { exact: true })).toBeVisible();
  await expect(page.getByText('2 tools across your company')).toBeVisible();
  await page.getByRole('link', { name: /Ahrefs/ }).click();
  await page.getByRole('button', { name: 'Cancel subscription', exact: true }).click();
  const confirmation = page.getByRole('dialog');
  await expect(confirmation.getByLabel('€129.00 changes to €30.00')).toBeVisible();
  await confirmation.getByRole('button', { name: 'Cancel subscription', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ahrefs cancelled' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to overview' }).click();

  await expect(page.getByText('€30.00', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('€30.00', { exact: true })).toBeVisible();
  await expect(page.getByText('€360.00 annualized')).toBeVisible();
  const seatCount = page.locator('p').filter({ has: page.getByText('seat', { exact: true }) });
  await expect(seatCount).toHaveText(/^1\s*seat$/);
  await expect(page.getByText('1 tool across your company')).toBeVisible();
  await expect(page.getByRole('link', { name: /Ahrefs/ })).toHaveCount(0);

  await page.getByRole('link', { name: 'Employees', exact: true }).click();
  await page.getByRole('link', { name: /Drew Cooper/ }).click();
  await expect(page.getByRole('link', { name: /ChatGPT Team/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Ahrefs/ })).toHaveCount(0);
});
