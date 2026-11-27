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

type FakeOptions = {
  /** Role of the signed-in member in the shared workspace. Default: admin. */
  role?: 'admin' | 'member';
  blocked?: boolean;
  /** Make this RPC fail with the given error code, e.g. { approve_request: 'request_not_pending' }. */
  failRpc?: Record<string, string>;
};

/** Tiny in-memory stand-in for the shared workspace tables and RPC functions. */
function fakeDb(options: FakeOptions) {
  const now = new Date().toISOString();
  const me = {
    user_id: user.id,
    email: user.email,
    name: 'Alex Example',
    role: options.role ?? 'admin',
    blocked: options.blocked ?? false,
    first_seen: now,
    last_seen: now,
  };
  return {
    members: [
      me,
      {
        user_id: '00000000-0000-4000-8000-000000000002',
        email: 'sam.example@example.com',
        name: 'Sam Example',
        role: 'member',
        blocked: false,
        first_seen: now,
        last_seen: now,
      },
    ],
    employees: [{ id: 'emp-drew', name: 'Drew Cooper', email: 'drew.cooper@example.com', role: 'Marketing' }],
    subscriptions: [
      {
        id: 'sub-ahrefs',
        tool: 'Ahrefs',
        plan: 'Standard',
        seats: 1,
        monthly_cost_eur: 99,
        renewal_date: '2026-11-21',
        status: 'active',
        employee_id: 'emp-drew',
      },
    ] as Record<string, unknown>[],
    requests: [
      {
        id: 'req-chatgpt',
        employee_id: 'emp-drew',
        tool: 'ChatGPT Team',
        monthly_cost_eur: 30,
        reason: 'Draft campaign copy and summarize customer research faster.',
        status: 'pending',
        requested_at: '2026-11-03',
      },
    ],
    activity: [] as Record<string, unknown>[],
    log(summary: string) {
      this.activity.unshift({
        id: this.activity.length + 1,
        at: new Date().toISOString(),
        actor_id: me.user_id,
        actor_email: me.email,
        actor_name: me.name,
        action: 'test',
        summary,
      });
    },
  };
}

async function fakeSupabase(page: Page, outcome: 'success' | 'cancel', options: FakeOptions = {}) {
  const db = fakeDb(options);
  const calls = { authorize: [] as URL[], token: 0, logout: 0, rpc: [] as { fn: string; args: Record<string, unknown> }[], db };
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
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const fn = url.pathname.slice('/rest/v1/rpc/'.length);
      const args = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
      calls.rpc.push({ fn, args });
      const failure = options.failRpc?.[fn];
      if (failure) return json({ code: 'P0001', message: failure, details: null, hint: null }, 400);
      const me = db.members[0];
      if (fn === 'join_workspace') return json(me);
      if (fn === 'approve_request') {
        const r = db.requests.find((x) => x.id === args.p_id)!;
        r.status = 'approved';
        db.log(`Approved the ${r.tool} request from Drew Cooper`);
      }
      if (fn === 'set_member_blocked') {
        const m = db.members.find((x) => x.user_id === args.p_user_id)!;
        m.blocked = Boolean(args.p_blocked);
        db.log(`Removed access for ${m.email}`);
      }
      return route.fulfill({ status: 204, body: '' });
    }
    const table = url.pathname.match(/^\/rest\/v1\/(\w+)$/)?.[1];
    if (table && table in db) return json(db[table as 'employees']);
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

test.describe('shared workspace', () => {
  async function signIn(page: Page, options: FakeOptions = {}, path = '/#/') {
    const calls = await fakeSupabase(page, 'success', options);
    await page.goto(path);
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    return calls;
  }

  test('loads the shared data from Supabase after sign-in', async ({ page }) => {
    const calls = await signIn(page, {}, '/#/employees');
    await expect(page.getByText('Drew Cooper').first()).toBeVisible();
    expect(calls.rpc.map((c) => c.fn)).toContain('join_workspace');
  });

  test('approving a request saves it and shows up in the activity log', async ({ page }) => {
    const calls = await signIn(page, {}, '/#/requests/req-chatgpt');
    await page.getByRole('button', { name: /^Approve/ }).click();
    await expect(page.getByRole('heading', { name: 'Request approved' })).toBeVisible();
    await expect.poll(() => calls.rpc.find((c) => c.fn === 'approve_request')?.args).toEqual({ p_id: 'req-chatgpt' });

    await page.goto('/#/activity');
    await expect(page.getByRole('heading', { name: 'Activity', level: 1 })).toBeVisible();
    await expect(page.getByText('approved the ChatGPT Team request from Drew Cooper')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('a change Supabase rejects shows "Not saved" and goes back to the saved data', async ({ page }) => {
    await signIn(page, { failRpc: { approve_request: 'request_not_pending' } }, '/#/requests/req-chatgpt');
    await page.getByRole('button', { name: /^Approve/ }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Not saved' })).toContainText(
      'Someone else already handled this request.',
    );
    await page.goto('/#/requests');
    await expect(page.getByText('ChatGPT Team').first()).toBeVisible();
  });

  test('members can see Activity but not Team access or the reset action', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page, { role: 'member' });
    const sidebar = page.locator('aside');
    await expect(sidebar.getByRole('link', { name: 'Activity' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Team access' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reset example data' })).toHaveCount(0);
    await page.goto('/#/team-access');
    await expect(page).toHaveURL(/#\/$/);
  });

  test('admins can remove someone\'s access on Team access', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const calls = await signIn(page);
    await page.locator('aside').getByRole('link', { name: 'Team access' }).click();
    await expect(page.getByRole('heading', { name: 'Team access', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Remove access for Alex Example/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Remove access for Sam Example' }).click();
    await expect(page.getByRole('button', { name: 'Restore access for Sam Example' })).toBeVisible();
    expect(calls.rpc.find((c) => c.fn === 'set_member_blocked')?.args).toEqual({
      p_user_id: '00000000-0000-4000-8000-000000000002',
      p_blocked: true,
    });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('blocked members see "You don\u2019t have access"', async ({ page }) => {
    await signIn(page, { blocked: true });
    await expect(page.getByRole('heading', { name: 'You don\u2019t have access' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to Subscribio' })).toBeVisible();
  });
});
