import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Automated accessibility scan (WCAG 2.1 A + AA) of every screen and state, at phone and
// desktop size. Covers the course basics: contrast >= 4.5:1, labelled inputs, names on
// buttons and links, landmarks. Focus visibility still needs a manual keyboard check.

const STORAGE_KEY = 'subscribio-state-v1';

type State = {
  subscriptions: { id: string; status: string }[];
  requests: { id: string; status: string }[];
};

/** Start from fresh example data, optionally changed, then open the route. */
async function open(page: Page, route: string, change?: (state: State) => void) {
  await page.goto('/#/');
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
  if (change) {
    const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    const state = JSON.parse(raw ?? '{}') as State;
    change(state);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(state)]);
  }
  await page.goto(`/#${route}`);
  await page.reload();
}

const setRequest = (status: string) => (s: State) => {
  s.requests[0].status = status;
};

type Screen = {
  name: string;
  owner: 'A' | 'B' | 'C';
  route: string;
  change?: (state: State) => void;
  act?: (page: Page) => Promise<void>;
};

const screens: Screen[] = [
  { name: '1.1 Overview', owner: 'A', route: '/' },
  { name: '2.1 Requests', owner: 'A', route: '/requests' },
  { name: '2.9 Nothing pending', owner: 'A', route: '/requests', change: setRequest('declined') },
  { name: '2.2 Request detail', owner: 'A', route: '/requests/req-chatgpt' },
  {
    name: '2.7 Confirm decline',
    owner: 'A',
    route: '/requests/req-chatgpt',
    act: (p) => p.getByRole('button', { name: 'Decline', exact: true }).click(),
  },
  { name: '2.3 Request approved', owner: 'A', route: '/requests/req-chatgpt/approved', change: setRequest('approved') },
  { name: '2.4 Ready to purchase', owner: 'A', route: '/requests/req-chatgpt/purchase', change: setRequest('approved') },
  {
    name: '2.5a Record purchase error',
    owner: 'A',
    route: '/requests/req-chatgpt/purchase',
    change: setRequest('approved'),
    act: async (p) => {
      await p.getByRole('button', { name: 'Record purchase', exact: true }).click();
      await p.getByLabel('Amount paid (€)').fill('');
      await p.getByRole('button', { name: 'Confirm purchase' }).click();
      await expect(p.getByText('Enter the amount you paid.')).toBeVisible();
    },
  },
  {
    name: '2.6 Purchase recorded',
    owner: 'A',
    route: '/requests/req-chatgpt/purchase',
    change: setRequest('approved'),
    act: async (p) => {
      await p.getByRole('button', { name: 'Record purchase', exact: true }).click();
      await p.getByRole('button', { name: 'Confirm purchase' }).click();
      await expect(p.getByRole('heading', { name: 'Purchase recorded' })).toBeVisible();
    },
  },
  { name: '2.8 Request declined', owner: 'A', route: '/requests/req-chatgpt/declined', change: setRequest('declined') },
  { name: '3.1 Employees', owner: 'B', route: '/employees' },
  { name: '3.2 Employee detail', owner: 'B', route: '/employees/emp-drew' },
  { name: '4.1 Renewal detail', owner: 'B', route: '/subscriptions/sub-ahrefs' },
  { name: '4.2 Confirm cancel', owner: 'B', route: '/subscriptions/sub-ahrefs/cancel' },
  {
    name: '4.3 Subscription cancelled',
    owner: 'B',
    route: '/subscriptions/sub-ahrefs/cancelled',
    change: (s) => {
      s.subscriptions[0].status = 'cancelled';
    },
  },
  { name: '4.4 Kept for now', owner: 'B', route: '/subscriptions/sub-ahrefs/kept' },
  { name: '5.1 Add employee', owner: 'C', route: '/add-employee' },
  {
    name: '5.2 Duplicate email',
    owner: 'C',
    route: '/add-employee',
    act: async (p) => {
      await p.getByRole('textbox', { name: 'Full name', exact: true }).fill('Jonas Vega');
      await p.getByRole('textbox', { name: 'Work email', exact: true }).fill('drew.cooper@example.com');
      await p.getByRole('button', { name: 'Add employee', exact: true }).click();
      await expect(p.getByText('This email is already used by Drew Cooper.')).toBeVisible();
    },
  },
  {
    name: '5.3 Employee added',
    owner: 'C',
    route: '/add-employee',
    act: async (p) => {
      await p.getByRole('textbox', { name: 'Full name', exact: true }).fill('Jonas Vega');
      await p.getByRole('textbox', { name: 'Work email', exact: true }).fill('jonas.vega@example.com');
      await p.getByRole('combobox', { name: 'Department' }).selectOption('Engineering');
      await p.getByRole('button', { name: 'Add employee', exact: true }).click();
      await expect(p.getByText('Jonas Vega joined Engineering.')).toBeVisible();
    },
  },
  { name: 'Design system', owner: 'C', route: '/design-system' },
  { name: 'Add subscription', owner: 'A', route: '/add-subscription' },
  {
    name: 'Add subscription errors',
    owner: 'A',
    route: '/add-subscription',
    act: async (p) => {
      await p.getByRole('button', { name: 'Add subscription', exact: true }).click();
      await expect(p.getByText('Enter the tool name.')).toBeVisible();
    },
  },
  {
    name: 'Subscription added',
    owner: 'A',
    route: '/add-subscription?employee=emp-drew',
    act: async (p) => {
      await p.getByRole('textbox', { name: 'Tool' }).fill('Figma');
      await p.getByRole('textbox', { name: 'Monthly cost (€)' }).fill('29');
      await p.getByRole('button', { name: 'Add subscription', exact: true }).click();
      await expect(p.getByRole('heading', { name: 'Subscription added' })).toBeVisible();
    },
  },
];

const viewports = [
  { label: 'phone', width: 440, height: 956 },
  { label: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test.describe(`accessibility (${viewport.label})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const screen of screens) {
      test(`Role ${screen.owner}: ${screen.name}`, async ({ page }) => {
        await open(page, screen.route, screen.change);
        if (screen.act) await screen.act(page);
        await page.waitForTimeout(300); // let the short "saving" states and animations settle

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const report = results.violations.map(
          (v) =>
            `[${v.impact}] ${v.id}: ${v.help}\n` +
            v.nodes
              .slice(0, 5)
              .map((n) => `    at ${n.target.join(' ')}\n      ${n.failureSummary?.split('\n').slice(1).join(' ').trim()}`)
              .join('\n'),
        );
        expect(report, report.join('\n\n')).toEqual([]);
      });
    }
  });
}
