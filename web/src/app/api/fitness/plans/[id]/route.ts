import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { cleanupPlanTasks } from '@/lib/fitness/dailyInjector';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
      ),
      diet_plans (
        *,
        meal_templates (
          *,
          meal_template_foods (*)
        )
      ),
      plan_adjustments (*)
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const body = await request.json();
  const { status, name, description } = body;

  const updates: any = {};
  if (status) updates.status = status;
  if (name) updates.name = name;
  if (description) updates.description = description;

  const { data, error } = await supabase
    .from('workout_plans')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If plan was archived or cancelled, cleanup associated active tasks
  if (status === 'archived' || status === 'cancelled') {
     await cleanupPlanTasks(user.id, params.id, supabase);
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { error } = await supabase
    .from('workout_plans')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clean up tasks as well
  await cleanupPlanTasks(user.id, params.id, supabase);

  return NextResponse.json({ success: true, message: 'Plan deleted' });
}
