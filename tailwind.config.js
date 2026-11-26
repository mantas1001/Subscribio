/** @type {import('tailwindcss').Config} */
// Design tokens taken from the Figma file "Subscribio prototype (mobile)", refined for the
// premium redesign (branch design/premium-redesign): quieter canvas, tinted elevation, display type.
// Pages must use these names, never raw hex values.
// Accessibility: three Figma text colours were below 4.5:1 contrast, so they are
// darkened slightly here (Figma value in the comment). Change them only together with the team.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f7f4', // app background (quieter, slightly cooler than Figma #fafbf8 so white cards lift off it)
        surface: '#ffffff', // cards, header, tab bar
        line: '#e3e8e2', // borders and dividers
        'line-strong': '#cdd6cc', // hover borders, table header rule
        faint: '#8a9a8f', // icons and decoration only (3:1 non-text contrast), never body text
        brand: {
          DEFAULT: '#244e3c', // primary buttons, highlight card, active tab
          ink: '#1f3a2e', // headings and main text
          soft: '#e7efe4', // note / tip background, avatar background
          accent: '#8aa67f', // logo dot and decoration only, not for text
          'accent-text': '#56744b', // eyebrow text (Figma #8aa67f)
          'on-dark': '#cfe0d4', // secondary text on brand background
        },
        'tool-ahrefs': '#f68c3a',
        muted: '#5c6f62', // secondary text (Figma #7a8f80)
        warn: {
          bg: '#fbf7e8', // pending card background
          line: '#e9ddb4', // pending card border
          ink: '#7a5c10', // pending text and badge text (Figma #a07a1e)
        },
        danger: {
          DEFAULT: '#b3261e', // decline / cancel text
          line: '#e8b4b0', // decline / cancel outline
          soft: '#fdecea', // declined status icon background
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['12px', { lineHeight: '1.3', letterSpacing: '1.6px' }],
        label: ['12px', { lineHeight: '1.3', letterSpacing: '0.01em' }], // table headers, small labels
        caption: ['13px', { lineHeight: '1.35' }],
        small: ['14px', { lineHeight: '1.4' }],
        body: ['15px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.45' }],
        section: ['17px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        title: ['28px', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        display: ['30px', { lineHeight: '1.1', letterSpacing: '-0.03em' }], // key numbers (KPIs)
      },
      boxShadow: {
        // Tinted to the brand ink, never pure black.
        card: '0 1px 2px rgba(22, 38, 30, 0.04), 0 1px 1px rgba(22, 38, 30, 0.02)',
        raised: '0 6px 16px -4px rgba(22, 38, 30, 0.10), 0 2px 4px -2px rgba(22, 38, 30, 0.06)',
        overlay: '0 24px 56px -12px rgba(22, 38, 30, 0.28), 0 8px 16px -8px rgba(22, 38, 30, 0.12)',
        button: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 2px rgba(22, 38, 30, 0.16)',
      },
      // Shape system: badges and chips 6px, controls (buttons, inputs) 10px, containers (cards) 14px.
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
      },
      spacing: {
        gutter: '20px',
        header: '52px',
        tabbar: '58px',
      },
      maxWidth: {
        app: '440px', // phone layout column (below lg)
        desktop: '1100px', // desktop content width (issue #10)
      },
      width: {
        sidebar: '248px', // desktop navigation
      },
    },
  },
  plugins: [],
};
