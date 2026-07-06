import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { GamificationService } from '@/lib/gamification.service';

const XP_PER_PROGRAM_SESSION = 50;

// POST /api/fitness/programs/:id/progress
// body: { session_id, workout_session_id? }
// Marks a program session complete, advances the enrollment, awards XP.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: programId } = await params;
  const { session_id, workout_session_id } = await request.json();
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Enrollment + program pacing.
  const { data: enrollment, error: enrErr } = await supabase
    .from('user_program_enrollments')
    .select('*, programs ( duration_weeks, sessions_per_week )')
    .eq('user_id', user.id)
    .eq('program_id', programId)
    .maybeSingle();

  if (enrErr) return NextResponse.json({ error: enrErr.message }, { status: 500 });
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled in this program' }, { status: 400 });

  // Was this session already completed? (avoid double-counting)
  const { data: existing } = await supabase
    .from('user_session_progress')
    .select('id, completed_at')
    .eq('enrollment_id', enrollment.id)
    .eq('session_id', session_id)
    .maybeSingle();

  const alreadyDone = !!existing?.completed_at;

  // Upsert the progress row as complete.
  const { error: progErr } = await supabase
    .from('user_session_progress')
    .upsert(
      {
        enrollment_id: enrollment.id,
        session_id,
        completed_at: new Date().toISOString(),
        workout_session_id: workout_session_id ?? null,
      },
      { onConflict: 'enrollment_id,session_id' }
    );

  if (progErr) return NextResponse.json({ error: progErr.message }, { status: 500 });

  // Nothing further to do if it was already counted.
  if (alreadyDone) {
    return NextResponse.json({ success: true, data: { enrollment, xpAwarded: 0, alreadyCompleted: true } });
  }

  // Advance the enrollment pointer.
  const perWeek = enrollment.programs?.sessions_per_week || 3;
  const totalWeeks = enrollment.programs?.duration_weeks || 4;

  let nextSession = (enrollment.current_session || 1) + 1;
  let nextWeek = enrollment.current_week || 1;
  if (nextSession > perWeek) {
    nextSession = 1;
    nextWeek += 1;
  }
  const finished = nextWeek > totalWeeks;

  const update: Record<string, unknown> = {
    completed_sessions: (enrollment.completed_sessions || 0) + 1,
    current_week: finished ? enrollment.current_week : nextWeek,
    current_session: finished ? enrollment.current_session : nextSession,
  };
  if (finished) {
    update.is_active = false;
    update.completed_at = new Date().toISOString();
  }

  const { data: updated, error: updErr } = await supabase
    .from('user_program_enrollments')
    .update(update)
    .eq('id', enrollment.id)
    .select('*, programs ( duration_weeks, sessions_per_week )')
    .single();

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Award XP.
  try {
    const gamification = new GamificationService(supabase);
    await gamification.addXp(user.id, XP_PER_PROGRAM_SESSION, { actionType: 'fitness' });
  } catch {
    // non-fatal
  }

  return NextResponse.json({
    success: true,
    data: { enrollment: updated, xpAwarded: XP_PER_PROGRAM_SESSION, programCompleted: finished },
  });
}
