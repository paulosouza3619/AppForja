import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function createBrowserSupabase() {
  const cfg = supabaseBrowserConfig();
  if (!cfg) return null;
  return createBrowserClient(cfg.url, cfg.key);
}

export function publicAvatarUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("data:") || path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/avatars/${path}`;
}
