import { SupabaseClient } from '@supabase/supabase-js'
import { generateResponse } from '@/lib/gemma'
import { batchGetExerciseVideos } from '@/lib/youtube'
import type {
  GeneratedPlan,
  FitnessInterviewData,
  PlanType,
} from '@/types/fitness'

/**
 * Plan Generator Service
 * Handles AI plan generation, DB persistence, and one-active-plan enforcement.
 */

// ── AI Prompt for Plan Generation (Phase 2) ──

function buildPlanPrompt(interviewData: FitnessInterviewData, calendarConflicts: string[]): string {
  return `You are a world-class personal trainer and nutritionist.
Based on the interview data below, generate a complete fitness protocol.

Interview Data:
- Goal: ${interviewData.goal}
- Fitness Level: ${interviewData.fitness_level}
- Age: ${interviewData.age}
- Weight: ${interviewData.weight_kg} kg
- Height: ${interviewData.height_cm} cm
- Injuries: ${interviewData.injuries || 'None'}
- Days per week: ${interviewData.days_per_week}
- Rest days: ${Array.isArray(interviewData.rest_days) ? interviewData.rest_days.join(', ') : interviewData.rest_days || 'None'}
- Preferred time: ${interviewData.preferred_time}
- Session duration: ${interviewData.session_duration_minutes} min
- Location: ${interviewData.training_location}
- Equipment: ${Array.isArray(interviewData.equipment) ? interviewData.equipment.join(', ') : interviewData.equipment || 'None'}
- Training style: ${interviewData.training_style}
- Target: ${interviewData.target_goal || 'General improvement'}
- Plan type: ${interviewData.plan_type}
${interviewData.duration_days ? `- Duration: ${interviewData.duration_days} days` : ''}

${interviewData.wants_diet ? `Diet Preferences:
- Budget per day (BDT): ${interviewData.food_budget_bdt || 200}
- Diet type: ${interviewData.diet_type || 'No restrictions'}
- Dislikes: ${interviewData.food_dislikes || 'None'}
- Meals per day: ${interviewData.meals_per_day || 3}
- Cooking: ${interviewData.cooking_preference || 'Both home and outside'}
- Supplements: ${interviewData.supplements || 'None'}` : 'No diet plan requested.'}

Calendar conflicts: ${calendarConflicts.length > 0 ? calendarConflicts.join('; ') : 'None'}

Return ONLY a valid JSON object matching this structure:
{
  "plan_meta": {
    "name": "string - descriptive name",
    "goal": "string",
    "plan_type": "${interviewData.plan_type}",
    ${interviewData.duration_days ? `"duration_days": ${interviewData.duration_days},` : ''}
    "difficulty": "beginner|intermediate|advanced",
    "days_per_week": ${interviewData.days_per_week},
    "session_duration_minutes": ${interviewData.session_duration_minutes},
    "includes_diet": ${!!interviewData.wants_diet}
  },
  "workout_days": [
    {
      "day_label": "Day 1 — Push (Chest & Shoulders)",
      "day_number": 1,
      ${interviewData.plan_type === 'fixed' ? '"scheduled_date": "YYYY-MM-DD",' : '"repeat_day": "mon|tue|wed|thu|fri|sat|sun",'}
      "scheduled_time": "HH:MM",
      "muscle_groups": ["Chest", "Shoulders"],
      "is_rest_day": false,
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 3,
          "reps": "10-12",
          "rest_seconds": 90,
          "weight_note": "Start light, 5-10kg",
          "technique_note": "Keep elbows tucked, full range of motion",
          "xp_per_completion": 10,
          "video_query": "bench press proper form"
        }
      ],
      "session_xp_bonus": 50
    }
  ]${interviewData.wants_diet ? `,
  "diet_plan": {
    "daily_targets": { "calories": 2400, "protein_g": 160, "carbs_g": 250, "fat_g": 60 },
    "budget_bdt_per_day": ${interviewData.food_budget_bdt || 200},
    "meals": [
      {
        "meal_type": "breakfast|lunch|dinner|snack",
        "suggested_time": "HH:MM",
        "foods": [
          { "name": "specific food", "quantity": "amount", "calories": 200, "protein_g": 20, "carbs_g": 30, "fat_g": 5, "approx_cost_bdt": 30 }
        ],
        "total_calories": 500,
        "notes": "substitution tips"
      }
    ]
  }` : ''}
}

Rules:
- Every exercise must include technique_note and video_query
- Include specific foods with BDT costs for diet plan
- Set session_xp_bonus to 50 for standard, 75 for sessions with weight logging
- Rest days must match the user's stated rest days exactly
- Include rest days in workout_days with is_rest_day: true and empty exercises
- Do not include markdown, commentary, or text outside the JSON`
}

// ── Generate Plan via AI ──

export async function generateFitnessPlan(
  interviewData: FitnessInterviewData,
  calendarConflicts: string[] = []
): Promise<GeneratedPlan> {
  const prompt = buildPlanPrompt(interviewData, calendarConflicts)

  const rawResponse = await generateResponse(prompt)
  if (!rawResponse) throw new Error('No response from AI for fitness plan generation')

  const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()

  try {
    const plan = JSON.parse(cleanJson) as GeneratedPlan
    return plan
  } catch (err) {
    console.error('[PlanGenerator] JSON Parse Error:', err, cleanJson.substring(0, 500))
    throw new Error('Failed to parse AI fitness plan response')
  }
}

// ── Save Generated Plan to Database ──

export async function savePlanToDb(
  userId: string,
  plan: GeneratedPlan,
  supabase: SupabaseClient
): Promise<{ planId: string; dietPlanId: string | null }> {
  // 1. Create workout_plans record
  const { data: planRow, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      user_id: userId,
      name: plan.plan_meta.name,
      description: `AI-generated ${plan.plan_meta.goal} protocol`,
      goal: plan.plan_meta.goal,
      plan_type: plan.plan_meta.plan_type,
      difficulty: plan.plan_meta.difficulty,
      days_per_week: plan.plan_meta.days_per_week,
      session_duration_min: plan.plan_meta.session_duration_minutes,
      is_ai_generated: true,
      is_active: true,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      end_date: plan.plan_meta.duration_days
        ? new Date(Date.now() + plan.plan_meta.duration_days * 86400000).toISOString().split('T')[0]
        : null,
    })
    .select()
    .single()

  if (planError) throw new Error(`Plan creation failed: ${planError.message}`)

  // 2. Create workout_days and exercises
  for (const day of plan.workout_days) {
    const { data: dayRow, error: dayError } = await supabase
      .from('workout_days')
      .insert({
        plan_id: planRow.id,
        day_number: day.day_number,
        day_label: day.day_label,
        name: day.day_label,
        muscle_groups: day.muscle_groups || [],
        rest_day: day.is_rest_day,
        scheduled_date: day.scheduled_date || null,
        repeat_day: day.repeat_day || null,
        scheduled_time: day.scheduled_time || null,
      })
      .select()
      .single()

    if (dayError) {
      console.error('[PlanGenerator] Day creation failed:', dayError)
      continue
    }

    if (day.is_rest_day || !day.exercises?.length) continue

    // Upsert exercises into global library + create workout_day_exercises
    for (let idx = 0; idx < day.exercises.length; idx++) {
      const ex = day.exercises[idx]
      const exerciseId = await upsertExercise(ex, supabase)

      if (exerciseId) {
        await supabase.from('workout_day_exercises').insert({
          workout_day_id: dayRow.id,
          exercise_id: exerciseId,
          sets: ex.sets || 3,
          reps: ex.reps || '10',
          rest_seconds: ex.rest_seconds || 60,
          order_index: idx,
          weight_note: ex.weight_note || null,
          technique_note: ex.technique_note || null,
          xp_per_set: 3,
          xp_full_exercise: ex.xp_per_completion || 10,
        })
      }
    }
  }

  // 3. Fetch YouTube videos for all exercises (async, non-blocking for plan creation)
  const exerciseNames = plan.workout_days
    .flatMap(d => d.exercises || [])
    .map(e => e.name)
  
  // Fire and forget — don't block plan creation for video fetching
  batchGetExerciseVideos([...new Set(exerciseNames)], supabase).catch(err => {
    console.error('[PlanGenerator] Video fetch error (non-blocking):', err)
  })

  // 4. Create diet plan if included
  let dietPlanId: string | null = null
  if (plan.diet_plan) {
    dietPlanId = await saveDietPlan(userId, planRow.id, plan.diet_plan, supabase)
  }

  return { planId: planRow.id, dietPlanId }
}

// ── Diet Plan Persistence ──

async function saveDietPlan(
  userId: string,
  workoutPlanId: string,
  diet: GeneratedPlan['diet_plan'],
  supabase: SupabaseClient
): Promise<string | null> {
  if (!diet) return null

  const { data: dietRow, error: dietError } = await supabase
    .from('diet_plans')
    .insert({
      user_id: userId,
      workout_plan_id: workoutPlanId,
      daily_calories: diet.daily_targets.calories,
      protein_target_g: diet.daily_targets.protein_g,
      carbs_target_g: diet.daily_targets.carbs_g,
      fat_target_g: diet.daily_targets.fat_g,
      budget_bdt_per_day: diet.budget_bdt_per_day,
      meals_per_day: diet.meals.length,
      is_active: true,
    })
    .select()
    .single()

  if (dietError) {
    console.error('[PlanGenerator] Diet plan creation failed:', dietError)
    return null
  }

  // Create meal templates + foods
  for (const meal of diet.meals) {
    const { data: mealRow, error: mealError } = await supabase
      .from('meal_templates')
      .insert({
        diet_plan_id: dietRow.id,
        meal_type: meal.meal_type,
        suggested_time: meal.suggested_time || null,
        total_calories: meal.total_calories,
        notes: meal.notes || null,
      })
      .select()
      .single()

    if (mealError) {
      console.error('[PlanGenerator] Meal template creation failed:', mealError)
      continue
    }

    if (meal.foods?.length) {
      const foodEntries = meal.foods.map(f => ({
        meal_template_id: mealRow.id,
        food_name: f.name,
        quantity: f.quantity,
        calories: f.calories,
        protein_g: f.protein_g,
        carbs_g: f.carbs_g,
        fat_g: f.fat_g,
        approx_cost_bdt: f.approx_cost_bdt,
      }))
      await supabase.from('meal_template_foods').insert(foodEntries)
    }
  }

  return dietRow.id
}

// ── Exercise Upsert (conflict-free) ──

async function upsertExercise(
  exerciseData: { name: string; technique_note?: string; video_query?: string },
  supabase: SupabaseClient
): Promise<string | null> {
  // Check if exercise already exists
  const { data: existing } = await supabase
    .from('exercises')
    .select('id')
    .ilike('name', exerciseData.name)
    .maybeSingle()

  if (existing) return existing.id

  // Insert new exercise into global library
  const { data: newExercise, error } = await supabase
    .from('exercises')
    .insert({
      name: exerciseData.name,
      muscle_group: 'general',
      difficulty: 'intermediate',
      technique_note: exerciseData.technique_note || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[PlanGenerator] Exercise upsert failed:', exerciseData.name, error)
    return null
  }

  return newExercise.id
}

// ── One-Active-Plan Rule ──

export async function deactivateExistingPlan(
  userId: string,
  planType: PlanType,
  supabase: SupabaseClient
): Promise<string | null> {
  // Find active plan of same type
  const typeFilter = planType === 'diet_only'
    ? ['diet_only']
    : ['ongoing', 'fixed', 'full']

  const { data: activePlans } = await supabase
    .from('workout_plans')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('plan_type', typeFilter)
    .limit(1)

  if (!activePlans?.length) return null

  const oldPlan = activePlans[0]

  // Deactivate plan
  await supabase
    .from('workout_plans')
    .update({
      is_active: false,
      status: 'deactivated',
      deactivated_at: new Date().toISOString(),
    })
    .eq('id', oldPlan.id)

  // Mark linked dailies as completed/finished
  await supabase
    .from('dailies')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('plan_id', oldPlan.id)
    .eq('is_completed', false)

  console.log(`[PlanGenerator] Deactivated plan: ${oldPlan.name} (${oldPlan.id})`)
  return oldPlan.id
}
