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
"Example data" label and a visible "Reset example data" action. Users sign in with Google
(Supabase Auth, see [Google sign-in](#google-sign-in)) and share one workspace stored in Supabase,
with an activity log (see [Shared workspace](#shared-workspace-and-activity-log)).

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
- Backend: Supabase only. Google sign-in (`src/auth/`) and one shared workspace in Supabase
  Postgres (`src/store/remote.ts`, `supabase/migrations/`). State lives in a React context with
  `useReducer`; in the shared workspace every change is shown at once and sent to a database
  function, and without Supabase keys (tests, local dev) it is saved to `localStorage`. `useStore()` returns state plus `approveRequest`, `declineRequest`,
  `recordPurchase`, `cancelSubscription`, `addEmployee({ name, email, role? })` (duplicate email error,
  case-insensitive), `resetExampleData`, and derived values `monthlySpend`, `annualizedSpend`
  (monthly × 12), `activeSubscriptionCount`, `activeSeatCount`, `pendingRequestCount`,
  `renewalsWithin30Days`, computed live and never hard-coded.
- Currency is euro (€) everywhere. English text only. No "Lorem ipsum". No real people's data.
- No fake claims: no AI features, no integrations, no bank connection. Only what the Figma
  frames show. No features, screens or backend that aren't in the frames (the Google sign-in
  screen is the one agreed exception).
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

- `Button` — `variant="primary" | "secondary" | "danger" | "danger-outline"`, `disabled`, visible focus; `aria-pressed` for pressed, `aria-invalid` for error; default `type="button"`.
- `LinkButton` — same look as `Button` (`to`, `variant`), but a real link; use it for actions that only navigate.
- `Card` — rounded, bordered, padded surface.
- `ListRow` — optional `chevron`, `leading`/`trailing` slots; render inside `<ul>`.
- `Input` — always-rendered `label`, optional `error`, `aria-invalid` + `aria-describedby`, `required`, `disabled`, forwarded `ref`.
- `Badge` — `tone="default" | "brand" | "warn" | "danger" | "success"`.
- `TopBar` — `title` (centred), optional back button (`onBack`, `backLabel`), `trailing`.
- `BottomNav` — `items: { label, href, icon?, active?, count? }[]`, `ariaLabel`; mobile bottom bar.
- `EmptyState` — `title`, `description`, `action`, `icon`.
- `ErrorMessage` — `message`, `title`, `role="alert"`.
- `Toast` — `message`, `title`, `variant="default" | "success" | "error"`, `onDismiss`, `aria-live`.

States covered: default, pressed, disabled, error, focus; `Input` default/error/disabled/required;
`EmptyState`; `ErrorMessage`; `Toast` default/success/error. See `/design-system` (Role C) and
`DESIGN_TOKENS.md`.

## Job 3 — Add employee (Role C)

`/add-employee` (frames 5.1–5.3):
- **5.1** "Add an employee" with `Full name`, `Work email` and an optional `Department`; one
  "Add employee" action (bottom bar on phone, inline on desktop); client validation; `aria-busy`
  "Adding…" state.
- **5.2** duplicate email (case-insensitive, via `addEmployee`): banner "An employee with this email
  already exists.", field message naming who uses it, and "Use a different email" / "See all team
  members". Everything typed is kept.
- **5.3** confirmation screen: "Employee added", the person's card with a "New" badge, "Back to
  employees" / "Back to overview". The new employee appears in Employees and in the Overview count.

`+ Add employee` on the Employees screen is a secondary (outlined) button placed below the list
(Role B). The form saves the department as the employee's role.

## Browser regression test

Run `npx playwright install chromium` once, then run `npm run test:e2e`.
The suite builds the app with sign-in switched off (`vite build --mode e2e`), checks core workflows
in Chromium, and runs automated
accessibility scans at phone and desktop widths.

`tests/auth.spec.ts` runs against a second build (`dist-auth/`, port 4175) with sign-in switched on
and a fake Supabase project answered inside the test, so it checks signing in, cancelling, signing
out and returning to the page you opened without a real Google account.

## Google sign-in

The whole app sits behind "Continue with Google". Code: `src/auth/` (Supabase client,
`AuthProvider`, `AuthGate`, `SignInPage`) and `src/components/layout/Account.tsx` (signed-in
account and "Sign out" in the sidebar and phone header).

How it behaves:

- Signed-out visitors see only the sign-in screen, at the address they opened. After signing in
  they land on that page (e.g. a shared `#/employees/e2` link).
- Cancelling at Google brings you back with "Sign-in was cancelled" and you stay signed out.
- "Sign out" signs out this browser only and returns to the sign-in screen.
- The PKCE flow is used because of `HashRouter`: Supabase returns `?code=…` in the query string, so
  it never collides with `#/routes`.
- Sign-in mode per build: Supabase keys set → sign-in required. `npm run dev` without keys or the
  `e2e` test build → no sign-in. A production build without keys → "Sign-in isn't set up yet" screen
  (fails closed, the app never opens without sign-in by accident).
- Everyone who signs in shares one workspace (see below).

### One-time setup

You need the published address, here `https://subscribio.vercel.app`. Replace `<ref>` below with
your Supabase project ref (the part before `.supabase.co`).

**1. Supabase project**

1. Create a project at [supabase.com](https://supabase.com) (the free plan is enough).
2. Project Settings → API Keys (or API): copy the **Project URL** and the **publishable key**
   (`sb_publishable_…`; the legacy `anon` key also works). Never use the `service_role` / secret key.
3. Authentication → Sign In / Providers → Google: copy the **Callback URL (for OAuth)**. It looks
   like `https://<ref>.supabase.co/auth/v1/callback`. Leave this page open.

**2. Google OAuth client** ([Google Cloud Console](https://console.cloud.google.com))

1. Create (or pick) a Google Cloud project.
2. Google Auth Platform → **Branding**: app name `Subscribio`, a support email and a developer
   contact email. Under authorized domains add `supabase.co`.
3. **Audience**: user type *External*, publishing status *Testing*. Add your own accounts under
   **Test users**. Note: because the app only asks for name, email and profile picture (no
   sensitive scopes), Google does **not** enforce the test-user list, so **any Google account can
   sign in**. Admins can remove someone's access on the Team access page.
4. **Data access**: the default `openid`, `.../auth/userinfo.email` and
   `.../auth/userinfo.profile` scopes are all that is needed (no verification required).
5. **Clients** → Create client → *Web application*:
   - Authorized JavaScript origins: `https://subscribio.vercel.app` and `http://localhost:5173`
   - Authorized redirect URIs: `https://<ref>.supabase.co/auth/v1/callback` (from step 1.3)
6. Copy the **Client ID** and **Client secret**.

**3. Turn on Google in Supabase**

1. Authentication → Sign In / Providers → Google: enable it, paste the Client ID and Client
   secret, save.
2. Authentication → URL Configuration:
   - **Site URL**: `https://subscribio.vercel.app/`
   - **Redirect URLs**: `https://subscribio.vercel.app/` and `http://localhost:5173/`. For Vercel
     preview deployments also add a pattern such as `https://subscribio-*.vercel.app/`.
   The app always returns to its base address (origin + path, with a trailing `/`), so these must
   match exactly.

**4. Vercel**

1. Project → Settings → Environment Variables: add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` for Production (and Preview).
2. Redeploy. Vite bakes these values in at build time, so an old deployment keeps showing
   "Sign-in isn't set up yet" until it is rebuilt.

**5. Local development**

Copy `.env.example` to `.env.local`, fill in the two values and run `npm run dev`
(`.env.local` is git-ignored).

### Test it on the published site

- Open `https://subscribio.vercel.app/#/employees` in a private window: you see the sign-in screen.
- Continue with Google with a test user: you land on Employees, with your name in the sidebar.
- Reload: still signed in.
- Sign out: back to the sign-in screen; a reload keeps you signed out.
- Continue with Google, then press Cancel / close Google's account chooser with "Back": you see
  "Sign-in was cancelled" (or the button is ready again) and stay signed out.

## Shared workspace and activity log

Everyone who signs in works in **one shared workspace** stored in Supabase, and every change is
recorded in an **activity log**.

- **Activity** page (`/activity`, all members): who did what and when, newest first, updating live.
- **Team access** page (`/team-access`, admins only): everyone who has signed in. Make someone an
  admin, remove admin rights, remove someone's access or restore it.
- Only admins can **Reset to zero** or **Load example data**, because that wipes everyone's data.
- If someone else changed the same thing first (e.g. two people approve one request), the change is
  refused, a "Not saved" message explains why and the page reloads the saved data.
- Admins are listed in the `admin_emails` table (seeded with `mantasdainauskas22@gmail.com`). Add
  an email there in Supabase → Table Editor to make someone admin on their next visit, or use
  Team access once they have signed in.
- Who has signed in is also visible in Supabase → Authentication → Users; the raw log is in the
  `activity` table (Table Editor).

How it is built (`supabase/migrations/0001_shared_workspace.sql`, run once in Supabase → SQL Editor):

- Tables `employees`, `subscriptions`, `requests`, `activity`, `members`, `admin_emails`, all with
  Row Level Security. Members can only **read**; the browser can't write to any table.
- Every change goes through a database function (`approve_request`, `record_purchase`,
  `add_employee`, `set_member_blocked`, …) that checks the caller, makes the change and writes the
  activity row in one transaction, so the log can't be skipped or faked from the browser.
- `join_workspace()` runs when the app opens: the first visit adds you to `members`.
- The app listens for new `activity` rows (Supabase Realtime) and reloads, so other people's changes
  appear without refreshing.

## Analytics (Microsoft Clarity)

Heatmaps and session recordings with [Microsoft Clarity](https://clarity.microsoft.com) (free),
project **Subscribio** (ID `zk7es1fao8`). Code: `src/analytics/clarity.ts`.

- **Starts automatically** on every visit; there is no banner. The app is shared only with
  friends, who are **told when they get the link** that their use is recorded (Clarity's terms
  require that visitors are informed). Anyone you share the link with should get that notice too.
- **Linked to members, pseudonymously:** signed-in visits send Clarity the Supabase user ID
  (`identify` + tag `user_id`) and the tag `role` (admin/member). No name or email is sent. Each
  member's user ID is shown on **Team access**; filter by it in Clarity to find their sessions.
- Clarity masks typed text by default; keep masking on (Clarity → Settings → Masking).
- Config: `VITE_CLARITY_PROJECT_ID` (Vercel env var, Production + Preview). Without it, or in the
  `e2e` test build, Clarity is not loaded.
- `tests/clarity.spec.ts` checks Clarity loads on its own; `tests/auth.spec.ts` checks the identify
  call contains no email.

## Git workflow

Branches are named `a/<task>`, `b/<task>`, `c/<task>`. Never commit directly to `main` (except
Role A's first scaffold). Commit small and often with clear messages. Push often. Before
starting: `git checkout main && git pull`. Before opening a pull request: merge `main` into your
branch and fix conflicts carefully. Never force-push. Open a pull request into `main`; a
teammate reviews quickly and merges. Keep PRs small. If `npm run build` fails on `main`, stop
and fix that first.

## Credits

- Figma prototype: Subscribio, `https://www.figma.com/design/MUCNmwo5em7ccPfXSGJ6Rt/Untitled`.
- Libraries: React, React DOM, React Router, Supabase JS (Google sign-in), Microsoft Clarity (analytics), Vite, TypeScript, Tailwind CSS, PostCSS, Autoprefixer.
- AI assistance used during development.
- All names, emails and prices are invented example data; no real people's data.
