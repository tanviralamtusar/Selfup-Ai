import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { checkAvailability } from '@/lib/fitness/calendarCheck';

export async function GET(request: NextRequest) {
  const { user, error: authError } = await verifyAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const url = new URL(request.url);
  const preferredDay = url.searchParams.get('day');
  const preferredTime = url.searchParams.get('time');
  const duration = parseInt(url.searchParams.get('duration') || '60', 10);

  if (!preferredDay || !preferredTime) {
    return NextResponse.json({ error: 'Missing day or time' }, { status: 400 });
  }

  try {
    const result = await checkAvailability(user.id, preferredDay, preferredTime, duration, supabase);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
