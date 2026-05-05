import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/ai/settings
 * Returns the user's AI configuration.
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

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        ai_persona_name, ai_persona_style, ai_custom_persona,
        ai_chat_model, ai_background_model,
        weekly_summary_day, weekly_summary_time
      `)
      .eq('id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: profile })
  } catch (err: any) {
    console.error('[AI Settings GET Error]:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/ai/settings
 * Updates the user's AI configuration.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: authError || 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Whitelist of allowed fields
    const allowedFields = [
      'ai_persona_name',
      'ai_persona_style',
      'ai_custom_persona',
      'ai_chat_model',
      'ai_background_model',
      'weekly_summary_day',
      'weekly_summary_time',
    ]

    const validModels = ['gemma-4-31b-it', 'gemini-2.5-flash', 'gemini-2.5-pro']
    const validPersonas = ['friendly', 'strict', 'motivational', 'neutral', 'sensei', 'rival', 'custom']
    const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

    // Build update object with validation
    const updates: Record<string, any> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // Validate specific fields
        if ((key === 'ai_chat_model' || key === 'ai_background_model') && !validModels.includes(body[key])) {
          return NextResponse.json({ success: false, error: `Invalid model: ${body[key]}` }, { status: 400 })
        }
        if (key === 'ai_persona_style' && !validPersonas.includes(body[key])) {
          return NextResponse.json({ success: false, error: `Invalid persona style: ${body[key]}` }, { status: 400 })
        }
        if (key === 'weekly_summary_day' && body[key] && !validDays.includes(body[key])) {
          return NextResponse.json({ success: false, error: `Invalid day: ${body[key]}` }, { status: 400 })
        }
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true, data: updates })
  } catch (err: any) {
    console.error('[AI Settings PATCH Error]:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
