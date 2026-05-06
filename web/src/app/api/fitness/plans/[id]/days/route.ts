import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { id } = await params;
  const body = await request.json();
  const { day_id, scheduled_date, scheduled_time, rest_day } = body;

  if (!day_id) {
    return NextResponse.json({ error: 'Missing day_id' }, { status: 400 });
  }

  // Ensure the day belongs to the plan and user owns the plan
  const { data: dayInfo, error: dayInfoError } = await supabase
    .from('workout_days')
    .select('id, plan_id, workout_plans!inner(user_id)')
    .eq('id', day_id)
    .eq('plan_id', id)
    .single();

  const workoutPlan = dayInfo?.workout_plans as any;
  if (dayInfoError || !dayInfo || (Array.isArray(workoutPlan) ? workoutPlan[0]?.user_id : workoutPlan?.user_id) !== user.id) {
    return NextResponse.json({ error: 'Unauthorized or day not found' }, { status: 404 });
  }

  const updates: any = {};
  if (scheduled_date !== undefined) updates.scheduled_date = scheduled_date;
  if (scheduled_time !== undefined) updates.scheduled_time = scheduled_time;
  if (rest_day !== undefined) updates.rest_day = rest_day;

  const { data, error } = await supabase
    .from('workout_days')
    .update(updates)
    .eq('id', day_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // NOTE: If we updated scheduled_date/time, we might need to sync with the injected Daily task.
  // In a full implementation, we would query the Daily by ID and update its scheduled_time/expires_on.

  return NextResponse.json({ success: true, data });
}
