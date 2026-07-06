// ═══════════════════════════════════════════════════════════
// Fitness Module v2.0 — TypeScript Interfaces
// ═══════════════════════════════════════════════════════════

// ── Plan Types ──

export type PlanType = 'ongoing' | 'fixed' | 'diet_only' | 'full'
export type PlanStatus = 'active' | 'paused' | 'completed' | 'failed' | 'deactivated'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type VideoSource = 'library' | 'youtube_api' | 'user'
export type AdjustmentStatus = 'pending' | 'approved' | 'modified' | 'ignored'
export type SessionStatus = 'partial' | 'complete'

// ── AI-Generated Plan (from Gemma response) ──

export interface GeneratedPlan {
  plan_meta: {
    name: string
    goal: string
    plan_type: PlanType
    duration_days?: number
    difficulty: Difficulty
    days_per_week: number
    session_duration_minutes: number
    includes_diet: boolean
  }
  workout_days: GeneratedWorkoutDay[]
  diet_plan?: GeneratedDietPlan
}

export interface GeneratedWorkoutDay {
  day_label: string
  day_number: number
  scheduled_date?: string
  repeat_day?: string
  scheduled_time: string
  muscle_groups: string[]
  is_rest_day: boolean
  exercises: GeneratedExercise[]
  session_xp_bonus: number
}

export interface GeneratedExercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  weight_note: string
  technique_note: string
  xp_per_completion: number
  video_query: string
  video_url?: string
}

export interface GeneratedDietPlan {
  daily_targets: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  budget_bdt_per_day: number
  meals: GeneratedMealTemplate[]
}

export interface GeneratedMealTemplate {
  meal_type: MealType
  suggested_time: string
  foods: GeneratedFoodItem[]
  total_calories: number
  notes: string
}

export interface GeneratedFoodItem {
  name: string
  quantity: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  approx_cost_bdt: number
}

// ── Database Row Types ──

export interface WorkoutPlanRow {
  id: string
  user_id: string
  name: string
  description: string | null
  goal: string
  plan_type: PlanType
  difficulty: Difficulty
  days_per_week: number | null
  session_duration_min: number | null
  is_ai_generated: boolean
  is_active: boolean
  status: PlanStatus
  start_date: string
  end_date: string | null
  deactivated_at: string | null
  created_at: string
  updated_at: string
  // Relations
  workout_days?: WorkoutDayRow[]
  diet_plans?: DietPlanRow[]
}

export interface WorkoutDayRow {
  id: string
  plan_id: string
  day_number: number
  day_label: string | null
  name: string
  muscle_groups: string[]
  rest_day: boolean
  scheduled_date: string | null
  repeat_day: string | null
  scheduled_time: string | null
  daily_id: string | null
  // Relations
  workout_day_exercises?: WorkoutDayExerciseRow[]
}

export interface ExerciseRow {
  id: string
  user_id: string | null
  name: string
  muscle_group: string
  equipment: string | null
  difficulty: string | null
  instructions: string | null
  technique_note: string | null
  video_url: string | null
  video_title: string | null
  video_source: VideoSource | null
  created_at: string
}

export interface WorkoutDayExerciseRow {
  id: string
  workout_day_id: string
  exercise_id: string
  sets: number
  reps: string
  rest_seconds: number
  order_index: number
  notes: string | null
  weight_note: string | null
  technique_note: string | null
  xp_per_set: number
  xp_full_exercise: number
  // Relations
  exercises?: ExerciseRow
}

export interface WorkoutSessionLogRow {
  id: string
  user_id: string
  workout_day_id: string
  plan_id: string
  logged_date: string
  status: SessionStatus
  sets_done: Record<string, { sets_completed: number; weights_used: number[]; reps_done?: number[] }>
  total_xp_earned: number
  session_bonus_xp: number
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

export interface DietPlanRow {
  id: string
  user_id: string
  workout_plan_id: string | null
  daily_calories: number | null
  protein_target_g: number | null
  carbs_target_g: number | null
  fat_target_g: number | null
  budget_bdt_per_day: number | null
  meals_per_day: number
  is_active: boolean
  created_at: string
  // Relations
  meal_templates?: MealTemplateRow[]
}

export interface MealTemplateRow {
  id: string
  diet_plan_id: string
  meal_type: MealType
  suggested_time: string | null
  total_calories: number | null
  notes: string | null
  // Relations
  meal_template_foods?: MealTemplateFoodRow[]
}

export interface MealTemplateFoodRow {
  id: string
  meal_template_id: string
  food_name: string
  quantity: string | null
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  approx_cost_bdt: number
}

export interface PlanAdjustmentRow {
  id: string
  plan_id: string
  user_id: string
  suggested_at: string
  reason: string | null
  suggestion: Record<string, unknown> | null
  status: AdjustmentStatus
  resolved_at: string | null
}

// ── Interview Data ──

export interface FitnessInterviewData {
  goal: string
  fitness_level: string
  age: number
  weight_kg: number
  height_cm: number
  injuries: string | null
  days_per_week: number
  rest_days: string[]
  preferred_time: string
  session_duration_minutes: number
  training_location: 'home' | 'gym'
  equipment: string[]
  training_style: string
  target_goal: string | null
  plan_type: PlanType
  duration_days?: number
  // Diet fields (optional)
  wants_diet: boolean
  food_budget_bdt?: number
  diet_type?: string
  food_dislikes?: string
  meals_per_day?: number
  cooking_preference?: string
  supplements?: string
}

// ── Plan Preview (shown in chat before activation) ──

export interface PlanPreview {
  plan_meta: GeneratedPlan['plan_meta']
  schedule_summary: { day: string; time: string; label: string }[]
  diet_summary?: {
    calories: number
    protein_g: number
    meals_per_day: number
    budget_bdt: number
  }
  total_xp_per_week: number
  coin_cost: number
}
