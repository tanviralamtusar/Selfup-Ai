import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { verifyAuth } from '@/lib/api-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** RLS-scoped client bound to the caller's access token. */
export function getDb(req: NextRequest): SupabaseClient {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

/**
 * Resolve the authenticated user + an RLS-scoped db client in one call.
 * Returns a ready NextResponse (401) in `res` when auth fails.
 */
export async function authed(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) {
    return { user: null, db: null, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { user, db: getDb(req), res: null }
}

/** Coerce a numeric-ish DB value to a JS number. */
export function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0))
  return Number.isFinite(n) ? n : 0
}
