/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase Project URL, e.g. https://abcd1234.supabase.co (Supabase → Project Settings → API). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable key (or the legacy anon key). Safe to ship to the browser. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Microsoft Clarity project ID (clarity.microsoft.com → Settings → Overview). Empty = analytics off. */
  readonly VITE_CLARITY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
