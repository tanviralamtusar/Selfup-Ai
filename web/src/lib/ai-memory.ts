import { createClient } from '@supabase/supabase-js'
import { PERSONA_PROMPTS } from './gemma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function fetchUserMemory(
  userId: string,
  _authToken?: string
): Promise<Record<string, string>> {
  try {
    // Use service role key to bypass RLS for server-side memory reads.
    // The anon key + auth header approach silently failed because
    // auth.uid() was not properly set in that context.
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })

    const { data: memories, error } = await supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const memoryMap: Record<string, string> = {}
    memories?.forEach((m: any) => {
      const key = m.memory_key || m.key
      const val = m.memory_val || m.value || m.memory_value
      if (key && val) {
        memoryMap[key] = val
      }
    })

    console.log(`[AI Memory] Fetched ${Object.keys(memoryMap).length} memory entries for user ${userId}`)
    return memoryMap
  } catch (err) {
    console.error('[AI Memory Fetch Error]:', err)
    return {}
  }
}

export async function formatMemoryContext(memory: Record<string, string>): Promise<string> {
  if (Object.keys(memory).length === 0) return ''

  const sections: string[] = []
  const categorizedKeys = new Set<string>()

  // Fitness context
  const fitnessKeys = ['fitness_goal', 'workout_frequency', 'fitness_level', 'recent_workouts']
  if (memory.fitness_goal || memory.workout_frequency || memory.fitness_level) {
    fitnessKeys.forEach(k => categorizedKeys.add(k))
    sections.push(`
REMEMBERED - Fitness Goals:
- Goal: ${memory.fitness_goal || 'Not set'}
- Frequency: ${memory.workout_frequency || 'Not specified'}
- Level: ${memory.fitness_level || 'Unknown'}
${memory.recent_workouts ? `- Recent Activity: ${memory.recent_workouts}` : ''}
`)
  }

  // Skills context
  const skillKeys = ['active_skills', 'learning_style', 'skill_milestones']
  if (memory.active_skills || memory.learning_style) {
    skillKeys.forEach(k => categorizedKeys.add(k))
    sections.push(`
REMEMBERED - Learning & Skills:
- Skills Learning: ${memory.active_skills || 'None tracked'}
- Style: ${memory.learning_style || 'Unknown'}
${memory.skill_milestones ? `- Milestones: ${memory.skill_milestones}` : ''}
`)
  }

  // Time management
  const timeKeys = ['sleep_schedule', 'work_hours', 'time_challenges', 'productivity_tools']
  if (memory.sleep_schedule || memory.work_hours || memory.time_challenges) {
    timeKeys.forEach(k => categorizedKeys.add(k))
    sections.push(`
REMEMBERED - Time Management:
- Sleep Schedule: ${memory.sleep_schedule || 'Unknown'}
- Work/Study Hours: ${memory.work_hours || 'Unknown'}
- Main Challenge: ${memory.time_challenges || 'Unknown'}
${memory.productivity_tools ? `- Preferred Tools: ${memory.productivity_tools}` : ''}
`)
  }

  // Style
  const styleKeys = ['style_preference', 'body_type', 'color_preference', 'style_goals']
  if (memory.style_preference || memory.body_type || memory.color_preference) {
    styleKeys.forEach(k => categorizedKeys.add(k))
    sections.push(`
REMEMBERED - Personal Style:
- Aesthetic: ${memory.style_preference || 'Unknown'}
- Body Type: ${memory.body_type || 'Unknown'}
- Colors: ${memory.color_preference || 'Unknown'}
${memory.style_goals ? `- Goals: ${memory.style_goals}` : ''}
`)
  }

  // Personality & preferences
  const personalityKeys = ['communication_style', 'motivation_type', 'user_challenges', 'achievements']
  if (memory.communication_style || memory.motivation_type || memory.user_challenges) {
    personalityKeys.forEach(k => categorizedKeys.add(k))
    sections.push(`
REMEMBERED - About the User:
- Prefers: ${memory.communication_style || 'Unknown communication style'}
- Motivated by: ${memory.motivation_type || 'Unknown'}
- Main Challenge: ${memory.user_challenges || 'Unknown'}
${memory.achievements ? `- Recent Wins: ${memory.achievements}` : ''}
`)
  }

  // AI Persona preferences
  const personaKeys = ['ai_interaction_style', 'preferred_advice_type']
  if (memory.ai_interaction_style || memory.preferred_advice_type) {
    personaKeys.forEach(k => categorizedKeys.add(k))
    const personaKey = memory.ai_interaction_style || 'friendly'
    const detailedPersona = PERSONA_PROMPTS[personaKey] || PERSONA_PROMPTS['friendly']

    sections.push(`
REMEMBERED - How to Help:
- Interaction Style Preference: ${personaKey}
- Advice Type: ${memory.preferred_advice_type || 'Balanced'}
- IMPORTANT TONE INSTRUCTIONS: ${detailedPersona}
`)
  }

  // Catch-all: include any memory keys NOT covered by the hardcoded categories above.
  // This ensures memories like "food_preference", "dietary_preference", "work_environment"
  // are never silently dropped.
  const uncategorizedEntries = Object.entries(memory).filter(
    ([key]) => !categorizedKeys.has(key)
  )
  if (uncategorizedEntries.length > 0) {
    const lines = uncategorizedEntries.map(
      ([key, val]) => `- ${key.replace(/_/g, ' ')}: ${val}`
    )
    sections.push(`
REMEMBERED - General Memories:
${lines.join('\n')}
`)
  }

  return sections.join('\n')
}

export async function extractAndSaveMemory(
  userId: string,
  userMessage: string,
  aiResponse: string,
  _authToken?: string
): Promise<void> {
  try {
    // Use service role key for reliable server-side writes
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })

    // Simple extraction patterns (in production, this could use NLP/ML)
    const memories: Array<{ key: string; value: string }> = []

    // Extract fitness goals
    if (/workout|gym|fitness|exercise|training/i.test(userMessage)) {
      const match = userMessage.match(/want to|goal is|trying to|planning to\s+([^.,]+)/i)
      if (match) {
        memories.push({
          key: 'fitness_goal',
          value: match[1].trim()
        })
      }
      
      const freqMatch = userMessage.match(/(\d+)\s+times?\s+(?:a|per)\s+(?:week|day)/i)
      if (freqMatch) {
        memories.push({
          key: 'workout_frequency',
          value: `${freqMatch[1]} times per week`
        })
      }
    }

    // Extract skill/learning goals
    if (/learn|studying|skill|programming|coding|language/i.test(userMessage)) {
      const skillMatch = userMessage.match(/(?:learn|studying|want to learn)\s+([^.,]+)/i)
      if (skillMatch) {
        memories.push({
          key: 'active_skills',
          value: skillMatch[1].trim()
        })
      }
    }

    // Extract time/schedule preferences
    if (/sleep|wake|morning|night|schedule|work hours/i.test(userMessage)) {
      const scheduleMatch = userMessage.match(/(?:wake at|sleep at|start at)\s+([^.,]+)/i)
      if (scheduleMatch) {
        memories.push({
          key: 'sleep_schedule',
          value: scheduleMatch[1].trim()
        })
      }
    }

    // Extract style preferences
    if (/style|fashion|outfit|dress|aesthetic|look/i.test(userMessage)) {
      const styleMatch = userMessage.match(/(?:prefer|like|love|enjoy)\s+([^.,]+)/i)
      if (styleMatch) {
        memories.push({
          key: 'style_preference',
          value: styleMatch[1].trim()
        })
      }
    }

    // Extract motivation type from AI suggestions
    if (/strict|motivational|encouraging|pushing|gentle|tough/i.test(aiResponse)) {
      if (/strict|tough/i.test(aiResponse)) {
        memories.push({ key: 'motivation_type', value: 'strict accountability' })
      } else if (/motivational|encouraging/i.test(aiResponse)) {
        memories.push({ key: 'motivation_type', value: 'supportive & motivational' })
      }
    }

    // NEW: Extract Diet/Nutrition
    if (/eat|diet|food|calories|protein|vegan|keto|carb/i.test(userMessage)) {
      const dietMatch = userMessage.match(/(?:i am|on a|following|eat)\s+([^.,]+)/i)
      if (dietMatch) {
        memories.push({ key: 'dietary_preference', value: dietMatch[1].trim() })
      }
    }

    // NEW: Extract Productivity Tools
    if (/using|app|tool|calendar|notion|obsidian|todoist/i.test(userMessage)) {
      const toolMatch = userMessage.match(/(?:use|using|my tool is)\s+([^.,]+)/i)
      if (toolMatch) {
        memories.push({ key: 'productivity_tools', value: toolMatch[1].trim() })
      }
    }

    // NEW: Extract Workplace/Environment
    if (/work|office|home|remote|desk|commute/i.test(userMessage)) {
      if (/work from home|remote/i.test(userMessage)) {
        memories.push({ key: 'work_environment', value: 'Remote / WFH' })
      } else if (/office|commute/i.test(userMessage)) {
        memories.push({ key: 'work_environment', value: 'Office / Commute' })
      }
    }

    // Save all extracted memories
    for (const mem of memories) {
      await supabase.from('ai_memory').upsert(
        {
          user_id: userId,
          memory_key: mem.key,
          memory_val: mem.value,
          source: 'chat',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,memory_key' }
      )
    }

    console.log(`[AI Memory] Extracted and saved ${memories.length} memory items for user ${userId}`)
  } catch (err) {
    console.error('[AI Memory Extract Error]:', err)
    // Don't throw - memory extraction is non-critical
  }
}

/**
 * Store a specific memory directly (called from onboarding, settings, etc.)
 */
export async function saveMemory(
  userId: string,
  memoryKey: string,
  memoryValue: string,
  _authToken?: string,
  source: string = 'system'
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })

    await supabase.from('ai_memory').upsert(
      {
        user_id: userId,
        memory_key: memoryKey,
        memory_val: memoryValue,
        source: source,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,memory_key' }
    )

    console.log(`[AI Memory] Saved memory: ${memoryKey}`)
  } catch (err) {
    console.error('[AI Memory Save Error]:', err)
    throw err
  }
}

/**
 * Clear all memory for a user (dangerous - use with caution)
 */
export async function clearUserMemory(
  userId: string,
  _authToken?: string
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })

    const { error } = await supabase
      .from('ai_memory')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
    console.log(`[AI Memory] Cleared all memory for user ${userId}`)
  } catch (err) {
    console.error('[AI Memory Clear Error]:', err)
    throw err
  }
}

