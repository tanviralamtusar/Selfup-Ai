import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { applyAdjustment, ignoreAdjustment } from '@/lib/fitness/adaptationEngine';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabase
    .from('plan_adjustments')
    .select('*')
    .eq('plan_id', params.id)
    .eq('user_id', user.id)
    .order('suggested_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const body = await request.json();
  const { adjustment_id, action } = body;

  if (!adjustment_id || !action) {
    return NextResponse.json({ error: 'Missing adjustment_id or action' }, { status: 400 });
  }

  try {
    let success = false;
    if (action === 'approve') {
      success = await applyAdjustment(adjustment_id, supabase);
    } else if (action === 'ignore') {
      success = await ignoreAdjustment(adjustment_id, supabase);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to update adjustment status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
