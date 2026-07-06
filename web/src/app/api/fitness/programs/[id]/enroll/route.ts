import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

// POST /api/fitness/programs/:id/enroll   → enroll (or re-activate) the user
// DELETE /api/fitness/programs/:id/enroll → leave the program
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: programId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Upsert the enrollment (unique on user_id + program_id). Re-activates if it existed.
  const { data: enrollment, error } = await supabase
    .from('user_program_enrollments')
    .upsert(
      { user_id: user.id, program_id: programId, is_active: true },
      { onConflict: 'user_id,program_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bump participant_count with the service role (RLS blocks users from
  // writing the shared catalog). Best-effort — don't fail enrollment on it.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: prog } = await admin
      .from('programs')
      .select('participant_count')
      .eq('id', programId)
      .single();
    if (prog) {
      await admin
        .from('programs')
        .update({ participant_count: (prog.participant_count || 0) + 1 })
        .eq('id', programId);
    }
  }

  return NextResponse.json({ success: true, data: enrollment });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: programId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { error } = await supabase
    .from('user_program_enrollments')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('program_id', programId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
