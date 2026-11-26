import { expect, test } from '@playwright/test';

test('a duplicate email can be corrected and the new employee persists', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/#/employees');
  await page.getByRole('button', { name: 'Add employee', exact: true }).click();

  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  const email = page.getByRole('textbox', { name: 'Email', exact: true });
  const submit = page.getByRole('button', { name: 'Add employee', exact: true });

  const department = page.getByRole('combobox', { name: 'Department' });
  await name.fill('Sam Rivera');
  await department.selectOption('Engineering');
  await email.fill('DREW.COOPER@EXAMPLE.COM');
  await submit.click();
  await expect(page.getByRole('alert')).toHaveText('Drew Cooper already uses this email.');
  await expect(email).toBeFocused();
  await expect(name).toHaveValue('Sam Rivera');
  await expect(department).toHaveValue('Engineering');

  await email.fill('sam.rivera@example.com');
  await submit.click();
  await expect(page.getByText('Employee added', { exact: true })).toBeVisible();
  await expect(page.getByText('Sam Rivera joined Engineering.')).toBeVisible();
  await page.getByRole('button', { name: 'Back to employees' }).click();
  await page.getByRole('link', { name: /Sam Rivera/ }).click();
  await expect(page.getByRole('heading', { name: 'No active subscriptions' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sam Rivera' })).toBeVisible();
  await expect(page.getByText('Engineering · sam.rivera@example.com')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No active subscriptions' })).toBeVisible();
});
