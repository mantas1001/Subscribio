/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase Project URL, e.g. https://abcd1234.supabase.co (Supabase → Project Settings → API). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable key (or the legacy anon key). Safe to ship to the browser. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Microsoft Clarity project ID (Clarity → Settings → Overview). Public. */
  readonly VITE_CLARITY_PROJECT_ID?: string;
  /** Google OAuth Web client ID. When set, sign-in uses Google's button on the app's own address. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
