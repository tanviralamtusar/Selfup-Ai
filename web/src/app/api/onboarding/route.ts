import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { supabaseServer } from '@/lib/supabase-server'
import { addAiTask } from '@/lib/queue'

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { displayName, age, gender, timezone, goals, persona, personaName, answers } = body

    // 1. Update Profile
    const supabase = await supabaseServer()
    const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
        display_name: displayName,
        age: parseInt(age) || null,
        gender,
        timezone,
        ai_persona_name: personaName || 'System',
        ai_persona_style: persona,
        onboarding_done: true,
    })
      .eq('id', user.id)

    if (profileError) throw profileError

    // 2. Save AI Memory (Goals)
    if (goals && goals.length > 0) {
      await supabase.from('ai_memory').upsert(
        {
          user_id: user.id,
          memory_key: 'user_goals',
          memory_val: goals.join(', '),
          source: 'onboarding'
        },
        { onConflict: 'user_id,memory_key' }
      )
    }

    // 3. Save AI Memory (Persona)
    if (persona) {
      await supabase.from('ai_memory').upsert(
        {
          user_id: user.id,
          memory_key: 'ai_interaction_style',
          memory_val: persona,
          source: 'onboarding'
        },
        { onConflict: 'user_id,memory_key' }
      )
    }

    // 4. Save AI Memory (Follow-up Answers)
    if (answers && typeof answers === 'object') {
      const memoryEntries = Object.entries(answers).map(([key, val]) => ({
        user_id: user.id,
        memory_key: `onboarding_answer_${key}`,
        memory_val: val as string,
        source: 'onboarding'
      }))

      if (memoryEntries.length > 0) {
        await supabase.from('ai_memory').upsert(memoryEntries, { onConflict: 'user_id,memory_key' })
      }
    }

    // 5. Enqueue initial plan generation
    const { data: queueRow, error: queueError } = await supabase
      .from('ai_queue')
      .insert({
        user_id: user.id,
        request_type: 'initial_plan',
        payload: { goals, persona, answers }
      })
      .select()
      .single()

    if (!queueError && queueRow) {
      await addAiTask({
        userId: user.id,
        type: 'initial_plan',
        payload: { goals, persona, answers },
        queueId: queueRow.id
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Onboarding API Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
