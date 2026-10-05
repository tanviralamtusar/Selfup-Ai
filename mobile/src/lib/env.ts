// Public config, inlined at build time from EXPO_PUBLIC_* vars (see .env.example).
//
// Values are cleaned because they're often pasted into CI settings with a
// trailing newline or quotes. A URL like "https://site.net\n" fails on Android
// with "Invalid URL host", which broke every API call in builds 3–5.

const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']|["']$/g, '').trim()

export const SUPABASE_URL = clean(process.env.EXPO_PUBLIC_SUPABASE_URL).replace(/\/+$/, '')
export const SUPABASE_ANON_KEY = clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)

/** Base URL of the SelfUp website, whose /api routes the app syncs through. No trailing slash. */
export const API_URL = clean(process.env.EXPO_PUBLIC_API_URL).replace(/\/+$/, '')

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && API_URL)
