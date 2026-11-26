import { expect, test } from '@playwright/test';

// "Reset example data" empties the workspace: every total becomes 0. "Load example data" brings
// the Figma example back.

test.beforeEach(async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('reset sets everything to zero and stays that way after a reload', async ({ page }) => {
  await expect(page.getByText('Example data', { exact: true }).filter({ visible: true })).toHaveCount(1);

  await page.getByRole('button', { name: 'Reset example data' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reset all data to zero?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Reset to zero' }).click();
  await expect(dialog).toHaveCount(0);

  const checkZero = async () => {
    await expect(page.getByText('€0.00', { exact: true })).toBeVisible();
    await expect(page.getByText('€0.00 annualized')).toBeVisible();
    await expect(page.getByText('0 tools across your company')).toBeVisible();
    await expect(page.getByText('In 0 departments')).toBeVisible();
    await expect(page.getByText('Nothing waiting')).toBeVisible();
    await expect(page.getByText('No renewals in the next 30 days.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your workspace is empty' })).toBeVisible();
    await expect(page.getByText('Example data', { exact: true }).filter({ visible: true })).toHaveCount(0);
  };
  await checkZero();
  await page.reload();
  await checkZero();

  await page.goto('/#/requests');
  await expect(page.getByRole('heading', { name: 'You’re all caught up' })).toBeVisible();
  await page.goto('/#/employees');
  await expect(page.getByRole('heading', { name: 'No employees yet' })).toBeVisible();
});

test('load example data brings the Figma example back', async ({ page }) => {
  await page.getByRole('button', { name: 'Reset example data' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset to zero' }).click();
  await expect(page.getByText('€0.00', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Load example data' }).click();
  await expect(page.getByText('€99.00', { exact: true })).toBeVisible();
  await expect(page.getByText('€1,188.00 annualized')).toBeVisible();
  await expect(page.getByRole('link', { name: /Review 1 pending request/ })).toBeVisible();
  await expect(page.getByText('Example data', { exact: true }).filter({ visible: true })).toHaveCount(1);
});
