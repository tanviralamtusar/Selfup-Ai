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

  const url = new URL(request.url);
  const activeOnly = url.searchParams.get('active_only') === 'true';

  let query = supabase
    .from('diet_plans')
    .select(`
      *,
      meal_templates (
        *,
        meal_template_foods (*)
      )
    `)
    .eq('user_id', user.id);

  if (activeOnly) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const body = await request.json();
  const { plan_id, status } = body;

  if (!plan_id || !status) {
    return NextResponse.json({ error: 'Missing plan_id or status' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('diet_plans')
    .update({ status })
    .eq('id', plan_id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
