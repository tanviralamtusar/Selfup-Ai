import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

// GET /api/fitness/programs/:id — full program (weeks → sessions → exercises)
// plus the current user's enrollment + per-session progress.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: program, error } = await supabase
    .from('programs')
    .select(`
      *,
      program_weeks (
        *,
        program_sessions (
          *,
          program_session_exercises (
            *,
            exercises (*)
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  // Sort nested collections (PostgREST doesn't guarantee order on embeds).
  program.program_weeks?.sort((a: any, b: any) => a.week_number - b.week_number);
  program.program_weeks?.forEach((w: any) => {
    w.program_sessions?.sort((a: any, b: any) => a.session_number - b.session_number);
    w.program_sessions?.forEach((s: any) =>
      s.program_session_exercises?.sort((a: any, b: any) => a.order_index - b.order_index)
    );
  });

  const { data: enrollment } = await supabase
    .from('user_program_enrollments')
    .select('*, user_session_progress (*)')
    .eq('user_id', user.id)
    .eq('program_id', id)
    .maybeSingle();

  return NextResponse.json({ success: true, data: { ...program, enrollment: enrollment ?? null } });
}
