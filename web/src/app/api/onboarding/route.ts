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

    // 4. Save AI Memory (Follow-up Answers - Mapped to Standard Keys)
    if (answers && typeof answers === 'object') {
      const memories: Array<{ key: string; val: string }> = []
      
      Object.entries(answers).forEach(([key, val]) => {
        const value = val as string
        if (!value) return

        // Generic save
        memories.push({ key: `onboarding_answer_${key}`, val: value })

        // Standardized mapping
        if (key === 'exp' || key === 'experience') {
          if (goals.includes('build_muscle') || goals.includes('lose_weight')) {
            memories.push({ key: 'fitness_level', val: value })
          } else if (goals.includes('learn_skills')) {
            memories.push({ key: 'learning_style', val: value })
          }
        }
        
        if (key === 'time' || key === 'commitment') {
          if (goals.includes('build_muscle') || goals.includes('lose_weight')) {
            memories.push({ key: 'workout_frequency', val: value })
          } else {
            memories.push({ key: 'work_hours', val: value })
          }
        }

        if (key === 'obstacle' || key === 'motivation') {
          memories.push({ key: 'user_challenges', val: value })
        }
      })

      // Goal specific mappings
      if (goals.includes('better_sleep')) memories.push({ key: 'sleep_schedule', val: 'Improving via onboarding' })
      if (goals.includes('style')) memories.push({ key: 'style_preference', val: 'Updating via onboarding' })

      if (memories.length > 0) {
        const memoryEntries = memories.map(m => ({
          user_id: user.id,
          memory_key: m.key,
          memory_val: m.val,
          source: 'onboarding'
        }))
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
