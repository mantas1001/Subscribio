# Design tokens

Source of truth: `tailwind.config.js`. Use token class names; never hard-code colours in pages
or components. All values below are token names; check `tailwind.config.js` for exact values.
Type scale, colours, spacing and radius are also rendered on `/design-system`.

**Desktop target (issue #10):** computer web page first, 1280–1440 px; `lg` (1024 px) switches to
left sidebar + wider content. `max-w-app` 440 px is the phone layout below `lg`; `max-w-desktop`
1100 px and `w-sidebar` 240 px are desktop. Figma source frames are 440 px mobile; adapt in code
unless desktop Figma frames exist. Flows, wording, states, store stay the same.

## Font

- `font-sans`: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif.

## Type scale

| Class | Size / line-height | Notes |
| --- | --- | --- |
| `text-eyebrow` | 12px / 1.3 | letter-spacing 1.6px; uppercase; `text-brand-accent-text` |
| `text-caption` | 13px / 1.3 | captions, metadata |
| `text-small` | 14px / 1.35 | secondary text, labels |
| `text-body` | 15px / 1.4 | body |
| `text-base` | 16px / 1.4 | base, inputs, row titles |
| `text-section` | 18px / 1.3 | section headings |
| `text-title` | 28px / 1.2 | screen titles |

Weights: `font-medium`, `font-semibold`, `font-bold`. English text only; no "Lorem ipsum".

## Colours

App background/surface:
- `bg-canvas` app background; `bg-surface` cards, header, tab bar; `border-line` borders/dividers; `text-brand-ink` headings/main text; `text-muted` secondary text.

Brand:
- `bg-brand` / `text-brand` / `border-brand` primary, active tab, highlight; `text-brand-ink`; `bg-brand-soft` note/tip background, avatar; `text-brand-accent-text` eyebrow; `bg-brand-accent` logo dot/decoration only, not text; `text-brand-on-dark` secondary text on brand. Not called "Acme Studio"; no company-name chip.

Warn:
- `bg-warn-bg`, `border-warn-line`, `text-warn-ink` pending.

Danger:
- `text-danger`, `border-danger`, `bg-danger`, `border-danger-line` decline/cancel/errors.
- `bg-danger-soft` light red fill: field with an error (2.5a, 5.2), error banner, declined icon.

Tools:
- `bg-tool-ahrefs` orange Ahrefs logo tile (Figma 1.1, 4.1). Decorative only (`aria-hidden`), the tool name is always written next to it. Other tools use `bg-brand-soft` + `text-brand` (2.1).

### Accessibility

- Text contrast ≥ 4.5:1. Some Figma text colours were darkened slightly (see comments in `tailwind.config.js`); change them only with the team.
- `brand-accent` is not for text. `brand-on-dark` is for text on `brand`. `warn-ink` for text on `warn-bg`.
- Colour is never the only carrier of meaning; pair with label, icon, text, `aria-label`, `role`, `aria-live`.
- Visible focus: `:focus-visible` outline 2px `brand`, offset 2px; components also apply `focus-visible:outline`.
- `role="alert"`, `role="status"`, `aria-live`, `aria-invalid`, `aria-describedby`, `aria-pressed`, `aria-current`, `aria-busy`, `aria-hidden` used appropriately.
- Labels for inputs always rendered; `required` marked; `disabled` not focusable; 44px minimum tap targets where practical.

## Spacing

- `p-gutter` 20px page padding; `gap-3` 12px; `gap-4` 16px; `p-4` 16px; `px-4` 16px; `py-3.5` 14px; `py-4` 16px; `p-8` 32px.
- `h-header` 52px top bar; `h-tabbar` 58px bottom nav; `min-h-[44px]` minimum tap target.
- `max-w-app` 440px phone column; `max-w-desktop` 1100px desktop content; `w-sidebar` 240px desktop navigation; `w-full`; `mx-auto`.
- `lg` = 1024px breakpoint; check 1280–1440px desktop; no raw `@media` colour changes.
- `rounded-sm` 8px; `rounded-md` 10px; `rounded-lg` 12px; `rounded-xl` 14px; `rounded-full`.

## Components

Shared in `src/components/ui/`, one file each, default-exported by name:

- `Button.tsx`: `variant` `primary` | `secondary` | `danger` | `danger-outline`, `disabled`, `className`, `type`; states default, pressed (`aria-pressed`), disabled, error (`aria-invalid`), focus-visible. Exports `buttonClasses()`.
- `LinkButton.tsx`: `to`, `variant`, `className`; Button look on a router `Link`, for navigation-only actions.
- `Card.tsx`: `children`, `className`.
- `ListRow.tsx`: `children`, `leading`, `trailing`, `chevron`, `className`; renders `<li>`.
- `Input.tsx`: `label`, `error`, `id`, `required`, `disabled`, `ref`, `className`, + input attributes; `aria-invalid`, `aria-describedby`, visible error; focus-visible.
- `Badge.tsx`: `children`, `tone` `default` | `brand` | `warn` | `danger` | `success`, `className`.
- `TopBar.tsx`: `title` (centred, as in Figma 2.2 and 5.1), `onBack`, `backLabel`, `trailing`, `className`.
- `BottomNav.tsx`: `items` `{ label, href, icon?, active?, count? }[]`, `ariaLabel`, `className`; mobile bottom bar; app shell uses desktop left sidebar on `lg`.
- `EmptyState.tsx`: `title`, `description`, `action`, `icon`, `className`.
- `ErrorMessage.tsx`: `message`, `title`, `className`, `role="alert"`.
- `Toast.tsx`: `message`, `title`, `variant` `default` | `success` | `error`, `onDismiss`, `dismissLabel`, `role="status"`/`role="alert"`, `aria-live`.

Import from these paths even before a component exists; Role C pushes shared components.
Don't edit component files you don't own; ask the owner.

## Page-level states

- Loading: `aria-busy`, disabled controls, "…" label; no fake spinner requirements.
- Empty: `EmptyState`.
- Error: `ErrorMessage` / `Input error` / `Toast variant="error"`; recoverable; `role="alert"`.
- Confirmation: a confirmation screen with a success icon and `role="status"` (2.3, 2.6, 2.8, 4.3, 5.3); `Toast variant="success"` for small inline confirmations.
- Pressed/disabled/focus on `Button`; invalid on `Input`.
- Example data labelled "Example data"; visible "Reset example data".

## Credits

Figma prototype; libraries listed in `README.md`; AI assistance used; all data invented example data.
