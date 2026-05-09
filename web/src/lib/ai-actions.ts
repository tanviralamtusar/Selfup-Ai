import { createClient } from '@supabase/supabase-js'
import { validateAction } from './validations/ai-actions'
import { saveMemory } from './ai-memory'
import { addAiTask } from './queue'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Types ──────────────────────────────────────

export interface Action {
  type: string
  payload: any
  requires_confirmation?: boolean
}

export interface ParsedResult {
  cleanText: string
  actions: Action[]
  confirmationActions: Action[]  // Actions that need user confirmation before executing
}

// ─── Parser ─────────────────────────────────────

/**
 * Parses action tags from AI response text.
 * Separates actions into immediate-execute and confirmation-pending.
 */
export function parseActions(text: string): ParsedResult {
  const actions: Action[] = []
  const confirmationActions: Action[] = []

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
        const jsonStr = contentRaw.replace(/```json/g, '').replace(/```/g, '').trim()
        payload = JSON.parse(jsonStr)
      } catch (e) {
        console.error(`[AI Actions] Failed to parse JSON for action ${type}:`, contentRaw?.substring(0, 200))
        continue
      }
    } else if (attributesRaw) {
      const attrRegex = /(\w+)="([^"]+)"/g
      let attrMatch
      while ((attrMatch = attrRegex.exec(attributesRaw)) !== null) {
        payload[attrMatch[1]] = attrMatch[2]
      }
    }

    // Validate against Zod schema
    const { data: validated, error: validationError } = validateAction(type, payload)
    if (validationError) {
      console.warn(`[AI Actions] Validation failed for ${type}: ${validationError}`)
      continue
    }

    const action: Action = { type, payload: validated || payload }

    // Route to confirmation queue or immediate execution
    if (validated?.requires_confirmation === true) {
      action.requires_confirmation = true
      confirmationActions.push(action)
    } else {
      actions.push(action)
    }
  }

  // Strip all action tags from visible text
  cleanText = text.replace(actionRegex, '').trim()

  return { cleanText, actions, confirmationActions }
}

// ─── Executor ───────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getServiceClient(): any {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[AI Actions] Missing Supabase URL or Service Role Key')
    throw new Error('Supabase configuration missing in actions')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/**
 * Executes a list of validated, non-confirmation actions.
 */
export async function executeActions(
  userId: string,
  actions: Action[]
): Promise<void> {
  if (!actions.length) return

  const supabase = getServiceClient()
  console.log(`[AI Actions] Executing ${actions.length} actions for user ${userId}`)

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'update_memory':
          await handleUpdateMemory(userId, action.payload)
          break
        case 'fitness_interview_start':
          await handleFitnessInterviewStart(userId, action.payload)
          break
        case 'fitness_plan_generate':
          await handleFitnessPlanGenerate(userId, action.payload, supabase)
          break
        case 'skill_roadmap_generate':
          await handleSkillRoadmapGenerate(userId, action.payload, supabase)
          break
        case 'schedule_day':
          await handleScheduleDay(userId, action.payload, supabase)
          break
        case 'weekly_summary_generate':
          await handleWeeklySummaryGenerate(userId, action.payload, supabase)
          break
        case 'suggest_guild_action':
          // Guild actions are never executed — they render as suggestion cards
          console.log(`[AI Actions] Guild suggestion rendered for user ${userId}`)
          break
        default:
          console.warn(`[AI Actions] Unknown action type: ${action.type}`)
      }
    } catch (err) {
      console.error(`[AI Actions] Error executing action ${action.type}:`, err)
    }
  }
}

/**
 * Execute a confirmed action (user clicked "Confirm" on the widget).
 */
export async function executeConfirmedAction(
  userId: string,
  action: any,
  messageId?: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getServiceClient()

  try {
    // 1. Mark action as confirmed in message metadata if messageId provided
    if (messageId) {
      const { data: message } = await supabase
        .from('ai_messages')
        .select('metadata')
        .eq('id', messageId)
        .single()

      if (message?.metadata?.actions) {
        const updatedActions = message.metadata.actions.map((a: any) => {
          // Match action by type and payload title/name
          const isMatch = a.type === action.type && 
                         (a.payload?.title === action.payload?.title || 
                          a.payload?.skill_name === action.payload?.skill_name ||
                          a.payload?.goal === action.payload?.goal);
          return isMatch ? { ...a, confirmed: true } : a
        })
        
        await supabase
          .from('ai_messages')
          .update({ metadata: { ...message.metadata, actions: updatedActions } })
          .eq('id', messageId)
      }
    }

    // 2. Execute the action
    switch (action.type) {
      case 'create_daily':
        return await handleCreateDaily(userId, action.payload, supabase)
      case 'create_habit':
        return await handleCreateHabit(userId, action.payload, supabase)
      case 'create_todo':
        return await handleCreateTodo(userId, action.payload, supabase)
      case 'fitness_plan_generate':
        await handleFitnessPlanGenerate(userId, action.payload, supabase)
        // Add a hidden confirmation message to the chat history so the AI knows it's done
        if (messageId) {
          const { data: originalMsg } = await supabase
            .from('ai_messages')
            .select('conversation_id')
            .eq('id', messageId)
            .single()
          
          if (originalMsg?.conversation_id) {
            await supabase.from('ai_messages').insert({
              conversation_id: originalMsg.conversation_id,
              user_id: userId,
              role: 'assistant',
              content: `[SYSTEM NOTIFICATION: The user has CONFIRMED the action "fitness_plan_generate". The plan is now successfully generated and active in the database. DO NOT generate this plan again.]`,
              metadata: { system_notification: true }
            })
          }
        }
        return { success: true, message: 'Fitness plan generation started.' }
      case 'skill_roadmap_generate':
        await handleSkillRoadmapGenerate(userId, action.payload, supabase)
        if (messageId) {
          const { data: originalMsg } = await supabase
            .from('ai_messages')
            .select('conversation_id')
            .eq('id', messageId)
            .single()
          
          if (originalMsg?.conversation_id) {
            await supabase.from('ai_messages').insert({
              conversation_id: originalMsg.conversation_id,
              user_id: userId,
              role: 'assistant',
              content: `[SYSTEM NOTIFICATION: The user has CONFIRMED the action "skill_roadmap_generate". The roadmap is now successfully generated and active in the database. DO NOT generate this roadmap again.]`,
              metadata: { system_notification: true }
            })
          }
        }
        return { success: true, message: 'Skill roadmap generation started.' }
      case 'tasks_clear_all':
        return await handleTasksClearAll(userId, action.payload, supabase)
      default:
        return { success: false, message: `Unknown action type: ${action.type}` }
    }
  } catch (err: any) {
    console.error(`[AI Actions] Confirmed action ${action.type} failed:`, err)
    return { success: false, message: err.message || 'Action failed.' }
  }
}

// ─── Action Handlers ────────────────────────────

async function handleCreateDaily(
  userId: string,
  payload: any,
  supabase: any
): Promise<{ success: boolean; message: string }> {
  const xpMap: Record<string, number> = { low: 5, medium: 10, high: 20, critical: 35 }
  const xp_reward = xpMap[payload.priority] || 10

  // Map repeat_days from string[] to number[] (0=Sun, 1=Mon, etc.)
  const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
  const target_days = payload.repeat_days?.map((d: string) => dayMap[d.toLowerCase()] ?? 0) || [0, 1, 2, 3, 4, 5, 6]

  const { error } = await supabase.from('dailies').insert({
    user_id: userId,
    title: payload.title,
    description: payload.description || '',
    priority: payload.priority || 'medium',
    category: payload.category || 'general',
    scheduled_time: payload.scheduled_time || null,
    repeat_type: payload.repeat_type || 'daily',
    target_days,
    xp_reward,
    xp_penalty: Math.floor(xp_reward * 0.5),
    source: 'ai',
  })

  if (error) throw error
  console.log(`[AI Actions] Created daily: ${payload.title}`)
  return { success: true, message: `Daily "${payload.title}" created.` }
}

async function handleCreateHabit(
  userId: string,
  payload: any,
  supabase: any
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.from('habits').insert({
    user_id: userId,
    title: payload.title,
    description: payload.description || '',
    category: payload.category || 'general',
    frequency: payload.reset_type || 'daily',
    target_days: [0, 1, 2, 3, 4, 5, 6],
    xp_reward: 5,
    coin_reward: 2,
    is_active: true,
    source: 'ai',
  })

  if (error) throw error
  console.log(`[AI Actions] Created habit: ${payload.title}`)
  return { success: true, message: `Habit "${payload.title}" created.` }
}

async function handleCreateTodo(
  userId: string,
  payload: any,
  supabase: any
): Promise<{ success: boolean; message: string }> {
  const xpMap: Record<string, number> = { low: 5, medium: 10, high: 20, critical: 35 }
  const xp_reward = xpMap[payload.priority] || 10

  const { error } = await supabase.from('todos').insert({
    user_id: userId,
    title: payload.title,
    description: payload.description || '',
    priority: payload.priority || 'medium',
    category: payload.category || 'general',
    due_date: payload.due_date || null,
    is_completed: false,
    xp_reward,
    xp_penalty: payload.due_date ? Math.floor(xp_reward * 0.5) : 0,
    source: 'ai',
  })

  if (error) throw error
  console.log(`[AI Actions] Created todo: ${payload.title}`)
  return { success: true, message: `To-Do "${payload.title}" created.` }
}

async function handleTasksClearAll(
  userId: string,
  payload: any,
  supabase: any
): Promise<{ success: boolean; message: string }> {
  const type = payload.task_type || 'all'
  let message = ''

  if (type === 'all' || type === 'todos') {
    const { error } = await supabase.from('todos').delete().eq('user_id', userId).eq('is_completed', false)
    if (error) throw error
    message += 'Active To-Dos cleared. '
  }

  if (type === 'all' || type === 'dailies') {
    const { error } = await supabase.from('dailies').delete().eq('user_id', userId)
    if (error) throw error
    message += 'Dailies cleared.'
  }

  console.log(`[AI Actions] Tasks cleared for user ${userId}: ${type}`)
  return { success: true, message: message.trim() || 'No tasks found to clear.' }
}

async function handleUpdateMemory(userId: string, payload: any): Promise<void> {
  if (!payload.key || !payload.value) {
    console.warn('[AI Actions] Memory update missing key or value')
    return
  }
  await saveMemory(userId, payload.key, payload.value, 'chat', payload.category)
  console.log(`[AI Actions] Saved memory: ${payload.key} = ${payload.value}`)
}

async function handleFitnessInterviewStart(userId: string, payload: any): Promise<void> {
  await saveMemory(userId, 'fitness_status', 'interview_in_progress', 'system', 'fitness')
  console.log(`[AI Actions] Started fitness interview for user ${userId}`)
}

async function handleFitnessPlanGenerate(
  userId: string,
  payload: any,
  supabase: any
): Promise<void> {
  // Execute fitness plan generation immediately (Queue system removed)
  await addAiTask({
    userId,
    type: 'fitness_plan',
    payload: {
      goal: payload.goal || 'overall',
      plan_type: payload.plan_type === 'fixed_duration' ? 'fixed' : (payload.plan_type === 'full_complete' ? 'full' : (payload.plan_type || 'ongoing')),
      days_per_week: payload.days_per_week || 4,
      experience_level: payload.experience_level || 'beginner',
      equipment: Array.isArray(payload.equipment) ? payload.equipment : (payload.equipment ? [payload.equipment] : ['full_gym']),
      preferred_time: payload.preferred_time || '08:00',
      session_duration_minutes: payload.session_duration_minutes || 60,
      health_conditions: payload.health_conditions || 'none',
      rest_days: Array.isArray(payload.rest_days) ? payload.rest_days : (payload.rest_days ? [payload.rest_days] : []),
      includes_diet: payload.includes_diet || false,
      budget_bdt: payload.budget_bdt,
      food_preference: payload.food_preference,
    },
  })

  await saveMemory(userId, 'fitness_status', 'plan_generating', 'system', 'fitness')
  console.log(`[AI Actions] Executed fitness_plan_generate directly for user ${userId}`)
}

async function handleSkillRoadmapGenerate(
  userId: string,
  payload: any,
  supabase: any
): Promise<void> {
  // 1. Create or find the skill in the database
  const skillName = payload.skill_name || 'Unknown Skill'
  const skillCategory = payload.skill_category || 'other'

  // Check if user already has this skill
  const { data: existingSkill } = await supabase
    .from('skills')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', skillName)
    .single()

  let skillId: string

  if (existingSkill?.id) {
    skillId = existingSkill.id
  } else {
    // Create new skill entry
    const { data: newSkill, error: skillError } = await supabase
      .from('skills')
      .insert({
        user_id: userId,
        name: skillName,
        category: skillCategory,
        tracking_mode: 'roadmap',
        is_active: true,
      })
      .select('id')
      .single()

    if (skillError) throw skillError
    skillId = newSkill.id
  }

  // 2. Map AI action payload → SkillInterviewData for the v2 roadmap generator
  const studyDays = payload.study_days || ['mon', 'wed', 'fri']
  const dailyMinutes = payload.daily_study_minutes || 30
  const weeklyHours = (dailyMinutes * studyDays.length) / 60

  const interviewData = {
    skill_name: skillName,
    current_level: payload.experience_level || 'beginner',
    goal: payload.goal || `Learn ${skillName}`,
    preferred_learning_style: payload.learning_style || 'mixed',
    time_commitment_hours_per_week: weeklyHours,
    preferred_study_days: studyDays,
    preferred_time: payload.preferred_time || '18:00',
    project_based: payload.project_based || false,
    needs_certification: payload.needs_certification || false,
    budget_bdt: 0,
  }

  // 3. Trigger the v2 skill_roadmap job (not the old 'roadmap' job)
  await addAiTask({
    userId,
    type: 'skill_roadmap',
    payload: {
      skillId,
      interviewData,
    },
  })
  
  console.log(`[AI Actions] Triggered v2 skill_roadmap for user ${userId}, skill: ${skillName} (${skillId})`)
}

async function handleScheduleDay(
  userId: string,
  payload: any,
  supabase: any
): Promise<void> {
  // Schedule day logic (previously queued, now direct or handled elsewhere)
  // For now, we still use the task structure but execute it immediately
  await addAiTask({
    userId,
    type: 'chat_analysis', // Or a new type if we had it
    payload: {
      intent: 'schedule_day',
      ...payload
    }
  })
  
  console.log(`[AI Actions] Executed schedule_day logic directly for user ${userId}`)
}

async function handleWeeklySummaryGenerate(
  userId: string,
  payload: any,
  supabase: any
): Promise<void> {
  await addAiTask({
    userId,
    type: 'weekly_summary_generate',
    payload
  })
  
  console.log(`[AI Actions] Executed weekly_summary_generate directly for user ${userId}`)
}
