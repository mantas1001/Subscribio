import { expect, test } from '@playwright/test';

for (const width of [1280, 1440]) {
  test(`employee and renewal screens use the desktop workspace at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/#/employees');

    const sidebar = page.getByRole('complementary').getByRole('navigation', { name: 'Main' });
    await expect(sidebar.getByRole('link', { name: 'Employees', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(1);

    const list = page.getByRole('list', { name: 'Employees', exact: true });
    await expect(list).toBeVisible();
    expect((await list.boundingBox())?.width).toBeGreaterThan(800);
    await page.getByRole('link', { name: /Drew Cooper/ }).click();

    const subscriptions = page.getByRole('region', { name: 'Subscriptions' });
    await expect(subscriptions).toBeVisible();
    const subscriptionPanel = (await subscriptions.boundingBox())!;
    const monthlyCost = (await page.getByText('Monthly cost', { exact: true }).boundingBox())!;
    expect(subscriptionPanel.x).toBeGreaterThan(monthlyCost.x + monthlyCost.width);

    await subscriptions.getByRole('link', { name: /Ahrefs/ }).click();
    await expect(sidebar).toBeVisible();
    await expect(page.getByText('Example data', { exact: true }).filter({ visible: true })).toHaveCount(1);
    expect(await page.locator('html').evaluate(root => root.scrollWidth)).toBe(width);
    const cancel = page.getByRole('button', { name: 'Cancel subscription', exact: true });
    await cancel.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Go back' })).toBeFocused();
    const dialogBox = (await dialog.boundingBox())!;
    expect(dialogBox.x + dialogBox.width / 2).toBeCloseTo(width / 2, 0);
    expect(dialogBox.y + dialogBox.height / 2).toBeCloseTo(400, 0);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(cancel).toBeFocused();

    await cancel.click();
    await dialog.getByRole('button', { name: 'Cancel subscription', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ahrefs cancelled' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to overview' }).click();
    await expect(page.getByText('€0.00', { exact: true })).toBeVisible();
  });
}
