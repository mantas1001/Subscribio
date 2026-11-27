import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Google sign-in flows against a fake Supabase project (see playwright.config.ts, project "auth").
// page.route plays the part of Supabase + Google: /authorize redirects straight back to the app
// with ?code=… (signed in) or ?error=access_denied (cancelled), /token returns a session.

const SUPABASE = 'https://auth-test.supabase.co';

function base64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

const now = () => Math.floor(Date.now() / 1000);

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'alex.example@example.com',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { full_name: 'Alex Example', email: 'alex.example@example.com' },
  created_at: new Date().toISOString(),
};

function session() {
  const exp = now() + 3600;
  const accessToken = `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({
    sub: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    exp,
    iat: now(),
  })}.signature`;
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: 'test-refresh-token',
    user,
  };
}

async function fakeSupabase(page: Page, outcome: 'success' | 'cancel') {
  const calls = { authorize: [] as URL[], token: 0, logout: 0 };
  await page.route(`${SUPABASE}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/auth/v1/authorize') {
      calls.authorize.push(url);
      const back = new URL(url.searchParams.get('redirect_to')!);
      if (outcome === 'success') back.searchParams.set('code', 'test-auth-code');
      else {
        back.searchParams.set('error', 'access_denied');
        back.searchParams.set('error_description', 'The user cancelled the sign-in');
      }
      return route.fulfill({ status: 302, headers: { location: back.toString() } });
    }
    if (url.pathname === '/auth/v1/token') {
      calls.token += 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session()) });
    }
    if (url.pathname === '/auth/v1/logout') {
      calls.logout += 1;
      return route.fulfill({ status: 204, body: '' });
    }
    if (url.pathname === '/auth/v1/user') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
    }
    return route.fulfill({ status: 404, body: '' });
  });
  return calls;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

test('signed-out visitors see only the sign-in screen', async ({ page }) => {
  await page.goto('/#/employees');
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
  await expect(page).toHaveTitle('Sign in · Subscribio');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('signing in returns to the page the user asked for, and signing out locks the app', async ({ page }) => {
  const calls = await fakeSupabase(page, 'success');
  await page.goto('/#/employees');
  await page.getByRole('button', { name: 'Continue with Google' }).click();

  // Back in the app, on the page from before sign-in, with a clean address bar.
  await expect(page).toHaveTitle('Employees · Subscribio');
  await expect(page).toHaveURL(/\/#\/employees$/);
  expect(new URL(page.url()).search).toBe('');

  // The request to Supabase asked for Google with PKCE and a redirect to the app's base URL.
  const authorize = calls.authorize[0];
  expect(authorize.searchParams.get('provider')).toBe('google');
  expect(authorize.searchParams.get('code_challenge_method')).toBe('s256');
  expect(authorize.searchParams.get('redirect_to')).toBe('http://127.0.0.1:4175/');
  expect(calls.token).toBe(1);

  // Still signed in after a reload.
  await page.reload();
  await expect(page).toHaveTitle('Employees · Subscribio');

  await page.goto('/#/');
  await page.getByRole('button', { name: `Sign out ${user.email}` }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
  expect(calls.logout).toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
});

test('cancelling at Google shows a message and keeps the user signed out', async ({ page }) => {
  await fakeSupabase(page, 'cancel');
  await page.goto('/#/requests');
  await page.getByRole('button', { name: 'Continue with Google' }).click();

  await expect(page.getByRole('alert')).toContainText('Sign-in was cancelled');
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
  await expect(page).toHaveURL(/\/#\/requests$/);
  expect(new URL(page.url()).search).toBe('');
});

test('desktop sidebar shows the signed-in account', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await fakeSupabase(page, 'success');
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const sidebar = page.locator('aside');
  await expect(sidebar.getByText('Alex Example')).toBeVisible();
  await expect(sidebar.getByText(user.email)).toBeVisible();
  await sidebar.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
});
