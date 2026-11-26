import { expect, test } from '@playwright/test';

test('dismissing cancellation and keeping a subscription leaves it active', async ({ page }) => {
  await page.goto('/#/');
  const renewal = page.getByRole('link', { name: /Ahrefs/ });
  await renewal.click();

  const cancel = page.getByRole('button', { name: 'Cancel subscription', exact: true });
  await cancel.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Go back' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(cancel).toBeFocused();

  await page.getByRole('button', { name: 'Keep it' }).click();
  await expect(page.getByRole('heading', { name: 'Kept for now' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to overview' }).click();
  await expect(page.getByText('€99.00', { exact: true })).toBeVisible();
  await expect(renewal).toBeVisible();
});
