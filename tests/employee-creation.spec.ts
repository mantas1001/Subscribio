import { expect, test } from '@playwright/test';

test('a duplicate email can be corrected and the new employee persists', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/#/employees');
  await page.getByRole('button', { name: 'Add employee', exact: true }).click();

  const name = page.getByRole('textbox', { name: 'Full name', exact: true });
  const email = page.getByRole('textbox', { name: 'Work email', exact: true });
  const submit = page.getByRole('button', { name: 'Add employee', exact: true });

  const department = page.getByRole('combobox', { name: 'Department' });
  await name.fill('Sam Rivera');
  await department.selectOption('Engineering');
  await email.fill('DREW.COOPER@EXAMPLE.COM');
  await submit.click();
  // Frame 5.2: banner + field message naming the person, recoverable actions.
  await expect(page.getByText('An employee with this email already exists.')).toBeVisible();
  await expect(page.getByText('This email is already used by Drew Cooper.')).toBeVisible();
  await expect(email).toBeFocused();
  await expect(name).toHaveValue('Sam Rivera');
  await expect(department).toHaveValue('Engineering');

  await page.getByRole('button', { name: 'Use a different email' }).click();
  await expect(email).toHaveValue('');
  await expect(email).toBeFocused();
  await email.fill('sam.rivera@example.com');
  await submit.click();
  // Frame 5.3
  await expect(page.getByRole('heading', { name: 'Employee added' })).toBeVisible();
  await expect(page.getByText('Sam Rivera joined Engineering.')).toBeVisible();
  await page.getByRole('button', { name: 'Back to employees' }).click();
  await page.getByRole('link', { name: /Sam Rivera/ }).click();
  await expect(page.getByRole('heading', { name: 'No active subscriptions' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sam Rivera' })).toBeVisible();
  await expect(page.getByText('Engineering · sam.rivera@example.com')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No active subscriptions' })).toBeVisible();
});
