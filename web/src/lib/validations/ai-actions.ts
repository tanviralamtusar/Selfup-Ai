import { z } from 'zod'

// ─── Task Creation Schemas ──────────────────────

export const createDailySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.enum(['general', 'fitness', 'skills', 'style', 'system']).default('general'),
  scheduled_time: z.string().optional(), // HH:mm
  repeat_type: z.enum(['daily', 'weekly']).default('daily'),
  repeat_days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  expires_on: z.string().optional(), // YYYY-MM-DD
  requires_confirmation: z.boolean().default(true),
})

export const createHabitSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['general', 'fitness', 'skills', 'style', 'system']).default('general'),
  reset_type: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  is_indefinite: z.boolean().default(true),
  end_date: z.string().optional(), // YYYY-MM-DD
  requires_confirmation: z.boolean().default(true),
})

export const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.enum(['general', 'fitness', 'skills', 'style', 'system']).default('general'),
  due_date: z.string().optional(), // YYYY-MM-DD
  scheduled_time: z.string().optional(), // HH:mm
  requires_confirmation: z.boolean().default(true),
})

// ─── Fitness Schemas ────────────────────────────

export const fitnessInterviewStartSchema = z.object({
  message: z.string(),
})

export const fitnessPlanGenerateSchema = z.object({
  goal: z.enum(['build_muscle', 'lose_fat', 'endurance', 'strength', 'overall']).default('overall'),
  plan_type: z.enum(['ongoing', 'fixed', 'full', 'diet_only']).default('ongoing'),
  duration_days: z.number().optional(),
  days_per_week: z.number().min(1).max(7).default(4),
  rest_days: z.array(z.string()).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  equipment: z.enum(['full_gym', 'home_gym', 'bodyweight', 'minimal']).default('full_gym'),
  preferred_time: z.string().optional(), // HH:mm
  session_duration_minutes: z.number().min(15).max(180).default(60),
  health_conditions: z.string().optional(),
  includes_diet: z.boolean().default(false),
  budget_bdt: z.number().optional(),
  food_preference: z.enum(['vegetarian', 'non_vegetarian', 'vegan', 'no_restriction']).optional(),
  description: z.string().optional(),
  requires_confirmation: z.boolean().default(true),
})

// ─── Skills Schemas ─────────────────────────────

export const skillRoadmapGenerateSchema = z.object({
  skill_name: z.string().min(1),
  skill_category: z.enum(['coding', 'language', 'music', 'creative', 'other']).default('other'),
  goal: z.string().optional(),
  plan_type: z.enum(['crash_course', 'standard', 'deep_dive', 'fixed', 'open_ended', 'goal_based']).default('standard'),
  duration_days: z.number().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  daily_study_minutes: z.number().min(10).max(480).default(30),
  study_days: z.array(z.string()).optional(),
  preferred_time: z.string().optional(), // HH:mm
  includes_tests: z.boolean().default(false),
  learning_style: z.enum(['videos', 'reading', 'projects', 'mixed']).default('mixed'),
  project_based: z.boolean().default(false),
  needs_certification: z.boolean().default(false),
  target_date: z.string().optional(),
  description: z.string().optional(),
  requires_confirmation: z.boolean().default(true),
})

// ─── Schedule & Memory Schemas ──────────────────

export const scheduleDaySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  include_unscheduled_dailies: z.boolean().default(true),
  include_overdue_todos: z.boolean().default(true),
  respect_dnd_hours: z.boolean().default(true),
})

export const updateMemorySchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  category: z.enum(['fitness', 'skills', 'gamification', 'personality', 'lifestyle', 'goals']).optional(),
  confidence: z.number().min(0).max(1).default(1.0),
})

// ─── Weekly Summary & Test Schemas ──────────────

export const weeklySummaryGenerateSchema = z.object({
  period_start: z.string(), // YYYY-MM-DD
  period_end: z.string(), // YYYY-MM-DD
})

export const evaluateTestAnswerSchema = z.object({
  test_id: z.string(),
  attempt_id: z.string(),
  question_id: z.string(),
  question_type: z.enum(['written', 'code_challenge']),
  question: z.string(),
  evaluation_criteria: z.string(),
  student_answer: z.string(),
  expected_output: z.string().optional(),
  max_points: z.number(),
})

// ─── Guild Schema ───────────────────────────────

export const suggestGuildActionSchema = z.object({
  action_type: z.enum(['send_hp', 'post_order', 'activate_buff', 'challenge_member']),
  suggestion_text: z.string(),
  target_member: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).default({}),
})

// ─── Task Management Schemas ────────────────────
export const tasksClearAllSchema = z.object({
  task_type: z.enum(['all', 'todos', 'dailies']).default('all'),
  reason: z.string().optional(),
  requires_confirmation: z.boolean().default(true),
})

// ─── Schema Registry ────────────────────────────

export const ACTION_SCHEMAS: Record<string, z.ZodTypeAny> = {
  create_daily: createDailySchema,
  create_habit: createHabitSchema,
  create_todo: createTodoSchema,
  tasks_clear_all: tasksClearAllSchema,
  fitness_interview_start: fitnessInterviewStartSchema,
  fitness_plan_generate: fitnessPlanGenerateSchema,
  skill_roadmap_generate: skillRoadmapGenerateSchema,
  schedule_day: scheduleDaySchema,
  update_memory: updateMemorySchema,
  weekly_summary_generate: weeklySummaryGenerateSchema,
  evaluate_test_answer: evaluateTestAnswerSchema,
  suggest_guild_action: suggestGuildActionSchema,
}

/**
 * Validates an action payload against its Zod schema.
 * Returns the validated data or null on failure.
 */
export function validateAction(type: string, payload: unknown): { data: any; error: string | null } {
  const schema = ACTION_SCHEMAS[type]
  if (!schema) {
    return { data: payload, error: null } // Unknown actions pass through
  }

  try {
    const data = schema.parse(payload)
    return { data, error: null }
  } catch (err: any) {
    const message = err.issues?.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ') || 'Validation failed'
    return { data: null, error: message }
  }
}
