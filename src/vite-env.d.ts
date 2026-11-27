/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase Project URL, e.g. https://abcd1234.supabase.co (Supabase → Project Settings → API). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable key (or the legacy anon key). Safe to ship to the browser. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
