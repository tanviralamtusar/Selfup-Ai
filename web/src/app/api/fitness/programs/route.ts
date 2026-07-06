import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

// GET /api/fitness/programs — published program catalog + this user's enrollments.
export async function GET(request: NextRequest) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [{ data: programs, error: progError }, { data: enrollments }] = await Promise.all([
    supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('participant_count', { ascending: false }),
    supabase
      .from('user_program_enrollments')
      .select('*')
      .eq('user_id', user.id),
  ]);

  if (progError) {
    return NextResponse.json({ error: progError.message }, { status: 500 });
  }

  // Attach the user's enrollment (if any) to each program.
  const byProgram = new Map((enrollments ?? []).map((e) => [e.program_id, e]));
  const data = (programs ?? []).map((p) => ({ ...p, enrollment: byProgram.get(p.id) ?? null }));

  return NextResponse.json({ success: true, data });
}
