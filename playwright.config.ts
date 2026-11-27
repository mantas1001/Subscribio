import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4174';
// Separate build with sign-in switched on, pointed at a fake Supabase project that
// tests/auth.spec.ts answers with page.route (no network, no real Google account).
const authURL = 'http://127.0.0.1:4175';
const FAKE_SUPABASE_URL = 'https://auth-test.supabase.co';

export default defineConfig({
  testDir: './tests',
  use: {
    viewport: { width: 440, height: 956 },
  },
  projects: [
    { name: 'app', testIgnore: /auth\.spec\.ts/, use: { baseURL } },
    { name: 'auth', testMatch: /auth\.spec\.ts/, use: { baseURL: authURL } },
  ],
  webServer: [
    {
      // The main suite runs against `vite build --mode e2e` (sign-in off), see test:e2e.
      command: 'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
      url: baseURL,
    },
    {
      command:
        'npx vite build --mode auth-test --outDir dist-auth && npx vite preview --outDir dist-auth --host 127.0.0.1 --port 4175 --strictPort --bypass-lock',
      url: authURL,
      timeout: 180_000,
      env: {
        VITE_SUPABASE_URL: FAKE_SUPABASE_URL,
        VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      },
    },
  ],
});
