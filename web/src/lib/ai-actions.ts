import { createClient } from '@supabase/supabase-js'
import { validateAction } from './validations/ai-actions'
import { saveMemory } from './ai-memory'

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
  action: Action
): Promise<{ success: boolean; message: string }> {
  const supabase = getServiceClient()

  try {
    switch (action.type) {
      case 'create_daily':
        return await handleCreateDaily(userId, action.payload, supabase)
      case 'create_habit':
        return await handleCreateHabit(userId, action.payload, supabase)
      case 'create_todo':
        return await handleCreateTodo(userId, action.payload, supabase)
      case 'fitness_plan_generate':
        await handleFitnessPlanGenerate(userId, action.payload, supabase)
        return { success: true, message: 'Fitness plan generation queued.' }
      case 'skill_roadmap_generate':
        await handleSkillRoadmapGenerate(userId, action.payload, supabase)
        return { success: true, message: 'Skill roadmap generation queued.' }
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
  // Queue a v3 fitness plan generation task
  const { error } = await supabase.from('ai_task_queue').insert({
    user_id: userId,
    request_type: 'fitness_plan_generate',
    payload: {
      goal: payload.goal || 'overall',
      plan_type: payload.plan_type || 'ongoing',
      days_per_week: payload.days_per_week || 4,
      experience_level: payload.experience_level || 'beginner',
      equipment: payload.equipment || 'full_gym',
      preferred_time: payload.preferred_time || '08:00',
      session_duration_minutes: payload.session_duration_minutes || 60,
      health_conditions: payload.health_conditions || 'none',
      rest_days: payload.rest_days || [],
      includes_diet: payload.includes_diet || false,
      budget_bdt: payload.budget_bdt,
      food_preference: payload.food_preference,
    },
    status: 'pending',
  })

  if (error) throw error
  await saveMemory(userId, 'fitness_status', 'plan_generating', 'system', 'fitness')
  console.log(`[AI Actions] Queued fitness_plan_generate for user ${userId}`)
}

async function handleSkillRoadmapGenerate(
  userId: string,
  payload: any,
  supabase: any
): Promise<void> {
  const { error } = await supabase.from('ai_task_queue').insert({
    user_id: userId,
    request_type: 'skill_roadmap_generate',
    payload: {
      skill_name: payload.skill_name,
      skill_category: payload.skill_category || 'other',
      goal: payload.goal,
      plan_type: payload.plan_type || 'open_ended',
      duration_days: payload.duration_days,
      experience_level: payload.experience_level || 'beginner',
      daily_study_minutes: payload.daily_study_minutes || 30,
      study_days: payload.study_days,
      learning_style: payload.learning_style || 'mixed',
      includes_tests: payload.includes_tests || false,
    },
    status: 'pending',
  })

  if (error) throw error
  console.log(`[AI Actions] Queued skill_roadmap_generate for user ${userId}`)
}

async function handleScheduleDay(
  userId: string,
  payload: any,
  supabase: any
): Promise<void> {
  const { error } = await supabase.from('ai_task_queue').insert({
    user_id: userId,
    request_type: 'schedule_day',
    payload,
    status: 'pending',
  })

  if (error) throw error
  console.log(`[AI Actions] Queued schedule_day for user ${userId}`)
}

async function handleWeeklySummaryGenerate(
  userId: string,
  payload: any,
  supabase: any
): Promise<void> {
  const { error } = await supabase.from('ai_task_queue').insert({
    user_id: userId,
    request_type: 'weekly_summary_generate',
    payload,
    status: 'pending',
  })

  if (error) throw error
  console.log(`[AI Actions] Queued weekly_summary_generate for user ${userId}`)
}
