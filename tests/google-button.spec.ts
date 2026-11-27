import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Sign-in with Google's own button (Google Identity Services), project "google" in
// playwright.config.ts: a build with VITE_GOOGLE_CLIENT_ID set. page.route plays Google (a fake
// gsi/client script whose button hands back an ID token) and Supabase (/token?grant_type=id_token).

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const ID_TOKEN = 'fake-google-id-token';

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = () => Math.floor(Date.now() / 1000);

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'alex.example@example.com',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { full_name: 'Alex Example' },
  created_at: new Date().toISOString(),
};

function session() {
  const exp = now() + 3600;
  return {
    access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp, iat: now() })}.sig`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: 'test-refresh-token',
    user,
  };
}

// Stand-in for https://accounts.google.com/gsi/client: renderButton draws a plain button that,
// when clicked, calls the callback with an ID token (like Google does after the popup).
const FAKE_GSI = `
  window.__gsi = {};
  window.google = { accounts: { id: {
    initialize(config) { window.__gsi.config = config; },
    renderButton(parent) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Continue with Google (Google button)';
      b.onclick = () => window.__gsi.config.callback({ credential: '${ID_TOKEN}' });
      parent.appendChild(b);
    },
    disableAutoSelect() { window.__gsi.disabled = true; },
  } } };
`;

async function fakeServices(page: Page, { gsi = true } = {}) {
  const calls = { tokenBodies: [] as Record<string, unknown>[], tokenGrants: [] as string[], authorize: 0 };
  await page.route('https://www.clarity.ms/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
  );
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    gsi ? route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_GSI }) : route.abort(),
  );
  await page.route('https://auth-test.supabase.co/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/auth/v1/token') {
      calls.tokenGrants.push(url.searchParams.get('grant_type') ?? '');
      calls.tokenBodies.push(route.request().postDataJSON() ?? {});
      return json(session());
    }
    if (url.pathname === '/auth/v1/authorize') {
      calls.authorize += 1;
      return route.fulfill({ status: 302, headers: { location: 'http://127.0.0.1:4176/?error=access_denied' } });
    }
    if (url.pathname === '/auth/v1/user') return json(user);
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, body: '' });
    if (url.pathname === '/rest/v1/rpc/join_workspace') {
      const t = new Date().toISOString();
      return json({ user_id: user.id, email: user.email, name: 'Alex Example', role: 'admin', blocked: false, first_seen: t, last_seen: t });
    }
    if (url.pathname.startsWith('/rest/v1/rpc/')) return route.fulfill({ status: 204, body: '' });
    if (url.pathname.startsWith('/rest/v1/')) return json([]);
    return route.fulfill({ status: 404, body: '' });
  });
  return calls;
}

// Each test gets a fresh browser context (empty storage). Routes are set before the first visit,
// so Google's real script is never loaded.

test('Google’s button signs in on this site and Supabase checks the nonce', async ({ page }) => {
  const calls = await fakeServices(page);
  await page.goto('/#/employees');
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
  const button = page.getByRole('button', { name: 'Continue with Google (Google button)' });
  await expect(button).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);

  const config = await page.evaluate(() => {
    const c = (window as unknown as { __gsi: { config: Record<string, unknown> } }).__gsi.config;
    return { client_id: c.client_id, nonce: c.nonce, ux_mode: c.ux_mode, auto_select: c.auto_select };
  });
  expect(config).toMatchObject({ client_id: CLIENT_ID, ux_mode: 'popup', auto_select: false });
  expect(config.nonce).toMatch(/^[0-9a-f]{64}$/);

  await button.click();
  // Stays on the page the user opened; no trip to xxxx.supabase.co.
  await expect(page).toHaveTitle('Employees · Subscribio');
  expect(calls.authorize).toBe(0);
  expect(calls.tokenGrants).toEqual(['id_token']);
  const body = calls.tokenBodies[0] as { provider: string; id_token: string; nonce: string };
  expect(body.provider).toBe('google');
  expect(body.id_token).toBe(ID_TOKEN);
  // Supabase gets the raw nonce; Google got its SHA-256 hash.
  const hashed = await page.evaluate(async (raw) => {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
  }, body.nonce);
  expect(hashed).toBe(config.nonce);

  // Signing out tells Google not to sign the same account straight back in.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('aside').getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __gsi: { disabled?: boolean } }).__gsi.disabled)).toBe(true);
});

test('if Google’s script can’t load, the redirect sign-in button is shown instead', async ({ page }) => {
  const calls = await fakeServices(page, { gsi: false });
  await page.goto('/#/');
  const fallback = page.getByRole('button', { name: 'Continue with Google' });
  await expect(fallback).toBeVisible();
  await fallback.click();
  await expect(page.getByRole('alert')).toContainText('Sign-in was cancelled');
  expect(calls.authorize).toBe(1);
});
