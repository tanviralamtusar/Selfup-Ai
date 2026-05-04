import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface Action {
  type: string;
  payload: any;
}

/**
 * Parses action tags from AI response text
 */
export function parseActions(text: string): { cleanText: string; actions: Action[] } {
  const actions: Action[] = []
  
  // Support both attribute-based (legacy/fallback) and JSON-content tags
  const actionRegex = /<action\s+type="([^"]+)"([^>]*)>(?:\s*([\s\S]*?)\s*<\/action>|\s*\/>)/g
  
  let match
  let cleanText = text

  while ((match = actionRegex.exec(text)) !== null) {
    const type = match[1]
    const attributesRaw = match[2]
    const contentRaw = match[3]

    let payload: any = {}

    if (contentRaw) {
      try {
        // Remove potential markdown code blocks around JSON
        const jsonStr = contentRaw.replace(/```json/g, '').replace(/```/g, '').trim()
        payload = JSON.parse(jsonStr)
      } catch (e) {
        console.error(`[AI Actions] Failed to parse JSON content for action ${type}:`, contentRaw)
      }
    } else if (attributesRaw) {
      // Basic attribute parsing for simple tags like <action type="create_task" title="Run" />
      const attrRegex = /(\w+)="([^"]+)"/g
      let attrMatch
      while ((attrMatch = attrRegex.exec(attributesRaw)) !== null) {
        payload[attrMatch[1]] = attrMatch[2]
      }
    }

    actions.push({ type, payload })
  }

  // Remove the tags from the display text
  cleanText = text.replace(actionRegex, '').trim()
  
  return { cleanText, actions }
}

/**
 * Executes a list of parsed actions
 */
export async function executeActions(
  userId: string,
  actions: Action[],
  authToken: string
): Promise<void> {
  if (!actions.length) return

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${authToken}` } }
  })

  console.log(`[AI Actions] Executing ${actions.length} actions for user ${userId}`)

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create_task':
          await handleCreateTask(userId, action.payload, supabase)
          break
        case 'skill_roadmap':
          await handleSkillRoadmap(userId, action.payload, supabase)
          break
        case 'memory_update':
          await handleMemoryUpdate(userId, action.payload, supabase)
          break
        case 'fitness_interview_start':
          await handleFitnessInterviewStart(userId, action.payload, supabase)
          break
        case 'fitness_plan_generate':
          await handleFitnessPlanGenerate(userId, action.payload, supabase)
          break
        default:
          console.warn(`[AI Actions] Unknown action type: ${action.type}`)
      }
    } catch (err) {
      console.error(`[AI Actions] Error executing action ${action.type}:`, err)
    }
  }
}

async function handleCreateTask(userId: string, payload: any, supabase: any) {
  const title = payload.title || payload.task_name || payload.name
  const description = payload.description || payload.notes || ''
  const priority = payload.priority || 'medium'
  const due_date = payload.due_date || payload.date || null
  const category = payload.category || payload.pillar || 'general'

  if (!title) {
    console.error('[AI Actions] Create task failed: No title found in payload', payload)
    return
  }

  // Calculate XP based on priority
  const xpMap: Record<string, number> = { low: 5, medium: 10, high: 20, critical: 35 }
  const xp_reward = xpMap[priority] || 10
  const xp_penalty = due_date ? Math.floor(xp_reward * 0.5) : 0

  const { error } = await supabase.from('todos').insert({
    user_id: userId,
    title,
    description,
    priority,
    category,
    due_date: due_date || null,
    is_completed: false,
    xp_reward,
    xp_penalty,
    source: 'ai'
  })

  if (error) throw error
  console.log(`[AI Actions] Created todo: ${title} (+${xp_reward} XP)`)
}

async function handleSkillRoadmap(userId: string, payload: any, supabase: any) {
  const skillName = payload.skillName || payload.skill_name || payload.name
  const category = payload.category || 'other'
  const milestones = payload.milestones || []

  if (!skillName || !milestones.length) {
    console.error('[AI Actions] Skill roadmap failed: Missing skillName or milestones', payload)
    return
  }

  // 1. Check if skill exists or create it
  let skillId: string
  const { data: existingSkill } = await supabase
    .from('skills')
    .select('id')
    .eq('user_id', userId)
    .eq('name', skillName)
    .single()

  if (existingSkill) {
    skillId = existingSkill.id
  } else {
    const { data: newSkill, error: skillError } = await supabase
      .from('skills')
      .insert({
        user_id: userId,
        name: skillName,
        category: category || 'other',
        is_active: true
      })
      .select()
      .single()

    if (skillError) throw skillError
    skillId = newSkill.id
  }

  // 2. Create Roadmap
  const { data: roadmap, error: roadmapError } = await supabase
    .from('skill_roadmaps')
    .insert({
      skill_id: skillId,
      title: `${skillName} Roadmap`,
      is_ai_generated: true
    })
    .select()
    .single()

  if (roadmapError) throw roadmapError

  // 3. Create Milestones
  const milestoneEntries = milestones.map((m: any, idx: number) => ({
    roadmap_id: roadmap.id,
    title: m.title,
    description: m.description,
    order_index: idx + 1,
    estimated_hours: m.estimated_hours || 1,
    is_completed: false
  }))

  const { error: milestoneError } = await supabase
    .from('skill_milestones')
    .insert(milestoneEntries)

  if (milestoneError) throw milestoneError
  console.log(`[AI Actions] Created roadmap for skill: ${skillName}`)
}

async function handleMemoryUpdate(userId: string, payload: any, supabase: any) {
  const memoryKey = payload.key || payload.category || 'fact'
  const memoryValue = payload.value || payload.content
  
  if (!memoryValue) {
    console.warn('[AI Actions] Memory update failed: No value found', payload)
    return
  }

  const { error } = await supabase.from('ai_memory').upsert(
    {
      user_id: userId,
      memory_key: memoryKey,
      memory_val: memoryValue,
      source: 'chat',
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,memory_key' }
  )

  if (error) throw error
  console.log(`[AI Actions] Saved memory: ${memoryKey} = ${memoryValue}`)
}

async function handleFitnessInterviewStart(userId: string, payload: any, supabase: any) {
  // Update AI Memory to note that fitness interview is in progress
  await handleMemoryUpdate(userId, {
    key: 'fitness_status',
    value: 'interview_in_progress'
  }, supabase)

  console.log(`[AI Actions] Started fitness interview for user ${userId}`)
}

async function handleFitnessPlanGenerate(userId: string, payload: any, supabase: any) {
  // Enqueue a v2 fitness plan generation task
  const { error } = await supabase.from('ai_task_queue').insert({
    user_id: userId,
    task_type: 'fitness_plan_v2',
    status: 'pending',
    payload: {
      goal: payload.goal || 'General Fitness',
      days: payload.days || 3,
      experience_level: payload.experience_level || 'beginner',
      equipment_available: payload.equipment_available || 'none',
      health_conditions: payload.health_conditions || 'none',
      plan_type: payload.plan_type || 'ongoing',
      preferred_time: payload.preferred_time || '08:00',
      session_duration_minutes: payload.session_duration_minutes || 45,
      rest_days: payload.rest_days || []
    }
  })

  if (error) {
    console.error(`[AI Actions] Failed to queue fitness plan generation:`, error)
    throw error
  }

  // Update memory state
  await handleMemoryUpdate(userId, {
    key: 'fitness_status',
    value: 'plan_generating'
  }, supabase)

  console.log(`[AI Actions] Queued fitness_plan_v2 task for user ${userId}`)
}
