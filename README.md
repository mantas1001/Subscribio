# Subscribio

A web app for the CEO or admin of a small company to manage the company's software
subscriptions. Team project for MNG261 at ISM University, rebuilt in code from the Subscribio
Figma prototype.

> **Desktop target.** Subscribio uses a sidebar and a wider workspace at 1024 px and above.
> The target review widths are 1280 and 1440 px. See [issue #10](https://github.com/mantas1001/Subscribio/issues/10).

Source of truth for the design is the Figma file
`https://www.figma.com/design/MUCNmwo5em7ccPfXSGJ6Rt/Untitled` (file key
`MUCNmwo5em7ccPfXSGJ6Rt`, page "Subscribio prototype (mobile)", 22 frames of 440 x 956 px).
Frames are named like `1.1 Overview`; clickable layers are named `link:KEY|label`, where the
destination frame name starts with `KEY`. Frame names and numbers win over prose.

All names, emails and prices in the app are invented example data. The app shows a small
"Example data" label and a visible "Reset example data" action. No backend, no login.

## Run it

Requires Node.js 20.19+ or 22.12+. Use an LTS release.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/; must pass with no errors
npm run preview  # preview the production build
```

The app uses `HashRouter` and a relative base path, so `dist/` works on any static host with no
server rewrites. **Desktop target:** computer web page first (1280–1440 px); on `lg` a left sidebar
and up to 1100 px content. Mobile (<1024 px) keeps 440 px phone layout/bottom bar.

## Stack and rules

- Vite + React + TypeScript + Tailwind CSS. React Router with `HashRouter`.
- No backend, no login. State lives in a React context with `useReducer`, saved to
  `localStorage`. `useStore()` returns state plus `approveRequest`, `declineRequest`,
  `recordPurchase`, `cancelSubscription`, `addEmployee({ name, email, role? })` (duplicate email error,
  case-insensitive), `resetExampleData`, and derived values `monthlySpend`, `annualizedSpend`
  (monthly × 12), `activeSubscriptionCount`, `activeSeatCount`, `pendingRequestCount`,
  `renewalsWithin30Days`, computed live and never hard-coded.
- Currency is euro (€) everywhere. English text only. No "Lorem ipsum". No real people's data.
- No fake claims: no AI features, no integrations, no bank connection. Only what the Figma
  frames show. No features, screens, backend or login that aren't in the frames.
- Design tokens (colours, type scale, spacing, radius) live in `tailwind.config.js`. Never
  hard-code colours in pages/components. See `DESIGN_TOKENS.md`.
- Accessibility basics: text contrast ≥ 4.5:1, labelled inputs, visible focus, colour never
  the only carrier of meaning. Desktop-first; check screens at 1280 and 1440 px width; phone at
  440 px still works.

## Project layout

| Path | What | Owner |
| --- | --- | --- |
| `tailwind.config.js` | Design tokens (colours, type, spacing, radius) | Role A |
| `src/types.ts` | Shared data contract | Role A |
| `src/store/` | State (`useStore()`), example data, formatting helpers | Role A |
| `src/App.tsx`, `src/components/layout/` | Routes and app shell | Role A |
| `src/pages/overview/`, `src/pages/requests/` | Job 1: handle a request | Role A |
| `src/pages/employees/`, `src/pages/subscriptions/` | Job 2: employees and cancelling | Role B |
| `src/components/ui/` | Shared UI components | Role C |
| `src/pages/add-employee/` | Job 3: add employee (frames 5.1–5.3) | Role C |
| `src/pages/design-system/` | `/design-system` page | Role C |
| `DESIGN_TOKENS.md`, `README.md` | Docs | Role C |

Don't edit files you don't own; ask the owner, or open a very small pull request and tell the
owner.

## Shared UI components

`src/components/ui/`, one file each, default-exported by name, importable from these paths:

- `Button` — `variant="primary" | "secondary" | "danger"`, `disabled`, visible focus; `aria-pressed` for pressed, `aria-invalid` for error; default `type="button"`.
- `Card` — rounded, bordered, padded surface.
- `ListRow` — optional `chevron`, `leading`/`trailing` slots; render inside `<ul>`.
- `Input` — always-rendered `label`, optional `error`, `aria-invalid` + `aria-describedby`, `required`, `disabled`, forwarded `ref`.
- `Badge` — `tone="default" | "brand" | "warn" | "danger" | "success"`.
- `TopBar` — `title`, optional back button (`onBack`, `backLabel`), `trailing`.
- `BottomNav` — `items: { label, href, icon?, active?, count? }[]`, `ariaLabel`; mobile bottom bar.
- `EmptyState` — `title`, `description`, `action`, `icon`.
- `ErrorMessage` — `message`, `title`, `role="alert"`.
- `Toast` — `message`, `title`, `variant="default" | "success" | "error"`, `onDismiss`, `aria-live`.

States covered: default, pressed, disabled, error, focus; `Input` default/error/disabled/required;
`EmptyState`; `ErrorMessage`; `Toast` default/success/error. See `/design-system` (Role C) and
`DESIGN_TOKENS.md`.

## Job 3 — Add employee (Role C)

`/add-employee` (frames 5.1–5.3): labelled `Name`, `Email`, and an optional `Department`, client validation, clear and
recoverable duplicate-email error via `addEmployee` (case-insensitive), `aria-busy` loading,
success confirmation, and the new employee added to shared state so it appears in the Employees
list. `+ Add employee` on the Employees screen is a secondary (outlined) button placed below
the list (Role B). The form saves the department as the employee’s role.

## Browser regression test

Run `npx playwright install chromium` once, then run `npm run test:e2e`.
The suite builds the production app, checks core workflows in Chromium, and runs automated
accessibility scans at phone and desktop widths.

## Git workflow

Branches are named `a/<task>`, `b/<task>`, `c/<task>`. Never commit directly to `main` (except
Role A's first scaffold). Commit small and often with clear messages. Push often. Before
starting: `git checkout main && git pull`. Before opening a pull request: merge `main` into your
branch and fix conflicts carefully. Never force-push. Open a pull request into `main`; a
teammate reviews quickly and merges. Keep PRs small. If `npm run build` fails on `main`, stop
and fix that first.

## Credits

- Figma prototype: Subscribio, `https://www.figma.com/design/MUCNmwo5em7ccPfXSGJ6Rt/Untitled`.
- Libraries: React, React DOM, React Router, Vite, TypeScript, Tailwind CSS, PostCSS, Autoprefixer.
- AI assistance used during development.
- All names, emails and prices are invented example data; no real people's data.
