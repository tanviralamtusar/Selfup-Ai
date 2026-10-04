// Public config, inlined at build time from EXPO_PUBLIC_* vars (see .env.example).

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Base URL of the SelfUp website, whose /api routes the app syncs through. No trailing slash. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '')

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && API_URL)
