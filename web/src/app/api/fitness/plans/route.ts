import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { deactivateExistingPlan } from '@/lib/fitness/planGenerator';

export async function GET(request: NextRequest) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');
  
  let query = supabase
    .from('workout_plans')
    .select(`
      *,
      workout_days (
        *,
        workout_day_exercises (
          *,
          exercises (*)
        )
      ),
      diet_plans (
        *,
        meal_templates (
          *,
          meal_template_foods (*)
        )
      )
    `)
    .eq('user_id', user.id);

  if (statusParam) {
    query = query.eq('status', statusParam);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  // Basic manual plan creation. For AI generated plans, the worker handles DB writes.
  // This endpoint might be used to save a drafted plan manually or to "activate" a generated plan.
  const body = await request.json();
  const { name, description, difficulty, goal, days_per_week, plan_type, session_duration_min, start_date, end_date, days } = body;

  // Enforce one-active-plan rule before inserting
  await deactivateExistingPlan(user.id, plan_type || 'ongoing', supabase);

  // Create the plan
  const { data: plan, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      user_id: user.id,
      name,
      description,
      difficulty,
      goal,
      days_per_week,
      plan_type: plan_type || 'ongoing',
      session_duration_min: session_duration_min || 60,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date,
      is_active: true,
      status: 'active'
    })
    .select()
    .single();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  // Create the days and exercises if provided
  if (days && Array.isArray(days)) {
    for (const day of days) {
      const { data: dayData, error: dayError } = await supabase
        .from('workout_days')
        .insert({
          plan_id: plan.id,
          day_number: day.day_number,
          day_label: day.day_label || day.name,
          name: day.name,
          muscle_groups: day.muscle_groups,
          rest_day: day.rest_day || false,
          scheduled_date: day.scheduled_date,
          repeat_day: day.repeat_day,
          scheduled_time: day.scheduled_time
        })
        .select()
        .single();

      if (!dayError && day.exercises) {
        const exercisesToInsert = day.exercises.map((ex: any, index: number) => ({
          workout_day_id: dayData.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets || 3,
          reps: ex.reps || '10',
          rest_seconds: ex.rest_seconds || 60,
          order_index: index,
          notes: ex.notes,
          xp_per_set: 3,
          xp_full_exercise: 10
        }));

        if (exercisesToInsert.length > 0) {
            await supabase.from('workout_day_exercises').insert(exercisesToInsert);
        }
      }
    }
  }

  return NextResponse.json({ success: true, data: plan });
}
