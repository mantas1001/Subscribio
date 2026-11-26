/** @type {import('tailwindcss').Config} */
// Design tokens taken from the Figma file "Subscribio prototype (mobile)".
// Pages must use these names, never raw hex values.
// Accessibility: three Figma text colours were below 4.5:1 contrast, so they are
// darkened slightly here (Figma value in the comment). Change them only together with the team.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#fafbf8', // app background
        surface: '#ffffff', // cards, header, tab bar
        line: '#e2e8df', // borders and dividers
        brand: {
          DEFAULT: '#244e3c', // primary buttons, highlight card, active tab
          ink: '#1f3a2e', // headings and main text
          soft: '#e7efe4', // note / tip background, avatar background
          accent: '#8aa67f', // logo dot and decoration only, not for text
          'accent-text': '#56744b', // eyebrow text (Figma #8aa67f)
          'on-dark': '#cfe0d4', // secondary text on brand background
        },
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
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['12px', { lineHeight: '1.3', letterSpacing: '1.6px' }],
        caption: ['13px', { lineHeight: '1.3' }],
        small: ['14px', { lineHeight: '1.35' }],
        body: ['15px', { lineHeight: '1.4' }],
        base: ['16px', { lineHeight: '1.4' }],
        section: ['18px', { lineHeight: '1.3' }],
        title: ['28px', { lineHeight: '1.2' }],
      },
      borderRadius: {
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
        app: '440px',
      },
    },
  },
  plugins: [],
};
