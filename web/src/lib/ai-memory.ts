import { createClient } from '@supabase/supabase-js'
import { PERSONA_PROMPTS } from './gemma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function fetchUserMemory(
  userId: string,
  authToken: string
): Promise<Record<string, string>> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } }
    })

    const { data: memories, error } = await supabase
      .from('ai_memory')
      .select('memory_key, memory_val')
      .eq('user_id', userId)

    if (error) throw error

    const memoryMap: Record<string, string> = {}
    memories?.forEach(m => {
      memoryMap[m.memory_key] = m.memory_val
    })

    return memoryMap
  } catch (err) {
    console.error('[AI Memory Fetch Error]:', err)
    return {}
  }
}

export async function formatMemoryContext(memory: Record<string, string>): Promise<string> {
  if (Object.keys(memory).length === 0) return ''

  const sections: string[] = []

  // Fitness context
  if (memory.fitness_goal || memory.workout_frequency || memory.fitness_level) {
    sections.push(`
REMEMBERED - Fitness Goals:
- Goal: ${memory.fitness_goal || 'Not set'}
- Frequency: ${memory.workout_frequency || 'Not specified'}
- Level: ${memory.fitness_level || 'Unknown'}
${memory.recent_workouts ? `- Recent Activity: ${memory.recent_workouts}` : ''}
`)
  }

  // Skills context
  if (memory.active_skills || memory.learning_style) {
    sections.push(`
REMEMBERED - Learning & Skills:
- Skills Learning: ${memory.active_skills || 'None tracked'}
- Style: ${memory.learning_style || 'Unknown'}
${memory.skill_milestones ? `- Milestones: ${memory.skill_milestones}` : ''}
`)
  }

  // Time management
  if (memory.sleep_schedule || memory.work_hours || memory.time_challenges) {
    sections.push(`
REMEMBERED - Time Management:
- Sleep Schedule: ${memory.sleep_schedule || 'Unknown'}
- Work/Study Hours: ${memory.work_hours || 'Unknown'}
- Main Challenge: ${memory.time_challenges || 'Unknown'}
${memory.productivity_tools ? `- Preferred Tools: ${memory.productivity_tools}` : ''}
`)
  }

  // Style
  if (memory.style_preference || memory.body_type || memory.color_preference) {
    sections.push(`
REMEMBERED - Personal Style:
- Aesthetic: ${memory.style_preference || 'Unknown'}
- Body Type: ${memory.body_type || 'Unknown'}
- Colors: ${memory.color_preference || 'Unknown'}
${memory.style_goals ? `- Goals: ${memory.style_goals}` : ''}
`)
  }

  // Personality & preferences
  if (memory.communication_style || memory.motivation_type || memory.user_challenges) {
    sections.push(`
REMEMBERED - About the User:
- Prefers: ${memory.communication_style || 'Unknown communication style'}
- Motivated by: ${memory.motivation_type || 'Unknown'}
- Main Challenge: ${memory.user_challenges || 'Unknown'}
${memory.achievements ? `- Recent Wins: ${memory.achievements}` : ''}
`)
  }

  // AI Persona preferences
  if (memory.ai_interaction_style || memory.preferred_advice_type) {
    const personaKey = memory.ai_interaction_style || 'balanced'
    const detailedPersona = PERSONA_PROMPTS[personaKey] || PERSONA_PROMPTS['balanced']

    sections.push(`
REMEMBERED - How to Help:
- Interaction Style Preference: ${personaKey}
- Advice Type: ${memory.preferred_advice_type || 'Balanced'}
- IMPORTANT TONE INSTRUCTIONS: ${detailedPersona}
`)
  }

  return sections.join('\n')
}

export async function extractAndSaveMemory(
  userId: string,
  userMessage: string,
  aiResponse: string,
  authToken: string
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } }
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
    if (/strict|motivational|encouraging|pushing|gentle/i.test(aiResponse)) {
      if (/strict/i.test(aiResponse)) {
        memories.push({ key: 'motivation_type', value: 'strict accountability' })
      } else if (/motivational|encouraging/i.test(aiResponse)) {
        memories.push({ key: 'motivation_type', value: 'supportive & motivational' })
      }
    }

    // Save all extracted memories
    for (const mem of memories) {
      await supabase.from('ai_memory').upsert(
        {
          user_id: userId,
          memory_key: mem.key,
          memory_val: mem.value,
          source: 'chat'
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
  authToken: string,
  source: string = 'system'
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } }
    })

    await supabase.from('ai_memory').upsert(
      {
        user_id: userId,
        memory_key: memoryKey,
        memory_val: memoryValue,
        source: source
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
  authToken: string
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } }
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
