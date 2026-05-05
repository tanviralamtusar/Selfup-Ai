import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { logSetComplete, completeSession } from '@/lib/fitness/sessionTracker';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const body = await request.json();
  const { action, exercise_id, set_number, weight_used } = body;

  try {
    if (action === 'log_set') {
      if (!exercise_id || set_number === undefined) {
        return NextResponse.json({ error: 'Missing exercise_id or set_number' }, { status: 400 });
      }
      const result = await logSetComplete(user.id, params.id, exercise_id, set_number, weight_used ?? null, supabase);
      return NextResponse.json({ success: true, data: result });
    } 
    else if (action === 'complete_session') {
      const result = await completeSession(user.id, params.id, supabase);
      return NextResponse.json({ success: true, data: result });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
