# Subscribio

A mobile-first web app for the CEO or admin of a small company to manage the company's
software subscriptions. Team project for MNG261 at ISM University, rebuilt in code from the
Subscribio Figma prototype.

All names, emails and prices in the app are invented example data.

## Run it

Needs Node.js 20 or newer.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

The app uses `HashRouter` and a relative base path, so `dist/` works on any static host.

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
| `src/pages/add-employee/`, `src/pages/design-system/` | Job 3 and design system | Role C |

Role C will extend this README with the design tokens and credits.
