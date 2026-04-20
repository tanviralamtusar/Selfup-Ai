import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabase
    .from('workout_plans')
    .select(`
      *,
      workout_days (
        *,
        workout_day_exercises (
          *,
          exercises (*)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const body = await request.json();
  const { name, description, difficulty, goal, days_per_week, days } = body;

  // 1. Create the plan
  const { data: plan, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      user_id: user.id,
      name,
      description,
      difficulty,
      goal,
      days_per_week,
      is_active: true
    })
    .select()
    .single();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  // 2. Create the days and exercises if provided
  if (days && Array.isArray(days)) {
    for (const day of days) {
      const { data: dayData, error: dayError } = await supabase
        .from('workout_days')
        .insert({
          plan_id: plan.id,
          day_number: day.day_number,
          name: day.name,
          muscle_groups: day.muscle_groups
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
          notes: ex.notes
        }));

        await supabase.from('workout_day_exercises').insert(exercisesToInsert);
      }
    }
  }

  return NextResponse.json(plan);
}
