import { expect, test } from '@playwright/test';

// Entering your own data: add a subscription by hand, see it everywhere, keep it after reload.

test.beforeEach(async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('empty form shows clear errors and moves focus to the first one', async ({ page }) => {
  await page.getByRole('link', { name: 'Add subscription', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Add a subscription' })).toBeVisible();

  await page.getByRole('button', { name: 'Add subscription', exact: true }).click();
  await expect(page.getByText('Enter the tool name.')).toBeVisible();
  await expect(page.getByText('Enter the monthly cost in euro, for example 29.00.')).toBeVisible();
  await expect(page.getByText('Choose who uses it.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Tool' })).toBeFocused();

  // Bad values are caught too.
  await page.getByRole('textbox', { name: 'Seats' }).fill('0');
  await page.getByRole('textbox', { name: 'Monthly cost (€)' }).fill('abc');
  await page.getByRole('button', { name: 'Add subscription', exact: true }).click();
  await expect(page.getByText('Enter at least 1 seat.')).toBeVisible();
});

test('a subscription added from an employee shows up everywhere and survives a reload', async ({ page }) => {
  await page.goto('/#/employees/emp-drew');
  await page.getByRole('link', { name: 'Add subscription', exact: true }).click();

  // Opened from Drew's page, so Drew is already chosen.
  await expect(page.getByRole('combobox', { name: 'Used by' })).toHaveValue('emp-drew');
  await page.getByRole('textbox', { name: 'Tool' }).fill('Figma');
  await page.getByRole('textbox', { name: 'Plan (optional)' }).fill('Professional');
  await page.getByRole('textbox', { name: 'Seats' }).fill('2');
  await page.getByRole('textbox', { name: 'Monthly cost (€)' }).fill('29,50');
  await page.getByLabel('Next renewal').fill('2026-11-20');
  await page.getByRole('button', { name: 'Add subscription', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Subscription added' })).toBeVisible();
  await expect(page.getByText('Figma is now active for Drew Cooper')).toBeVisible();
  await expect(page.getByText('Figma · Professional')).toBeVisible();
  await expect(page.getByText('€29.50')).toBeVisible();

  await page.getByRole('link', { name: 'Back to overview' }).click();
  await expect(page.getByText('€128.50', { exact: true })).toBeVisible(); // 99 + 29.50
  await expect(page.getByText('€1,542.00 annualized')).toBeVisible();
  await expect(page.getByText('2 tools across your company')).toBeVisible();
  await expect(page.getByRole('link', { name: /Figma/ })).toBeVisible(); // renews within 30 days

  await page.reload();
  await expect(page.getByText('€128.50', { exact: true })).toBeVisible();
  await page.goto('/#/employees/emp-drew');
  await expect(page.getByRole('link', { name: /Figma/ })).toBeVisible();
});

test('with no team members it explains what to do first', async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem('subscribio-state-v1', JSON.stringify({ subscriptions: [], employees: [], requests: [] })),
  );
  await page.goto('/#/add-subscription');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Add a team member first' })).toBeVisible();
  await page.getByRole('link', { name: 'Add employee' }).click();
  await expect(page.getByRole('heading', { name: 'Add an employee' })).toBeVisible();
});
