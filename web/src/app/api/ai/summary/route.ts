import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/ai/summary/latest
 * Returns the most recent weekly summary.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: authError || 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all')

    if (all === 'true') {
      // Return all summaries
      const { data, error } = await supabase
        .from('ai_weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('period_end', { ascending: false })
        .limit(20)

      if (error) throw error
      return NextResponse.json({ success: true, data })
    } else {
      // Return latest summary
      const { data, error } = await supabase
        .from('ai_weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('period_end', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return NextResponse.json({ success: true, data: data || null })
    }
  } catch (err: any) {
    console.error('[AI Summary Error]:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
