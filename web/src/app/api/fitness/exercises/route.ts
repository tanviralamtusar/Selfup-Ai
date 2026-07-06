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
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  // Both accept comma-separated lists. `primary_muscle` = granular values
  // from the muscle-map (chest, lats, quadriceps…); `muscle_group` = broad
  // groups (Chest, Back, Legs…). When both are given we OR them, so the
  // filter works whether or not the attributes migration has been applied.
  const muscleGroup = searchParams.get('muscle_group');
  const primaryMuscle = searchParams.get('primary_muscle');

  let dbQuery = supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })
    .limit(300);

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`);
  }

  // Quote values so entries with spaces (e.g. "middle back") parse in a PostgREST in-list.
  const inList = (raw: string) =>
    raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => `"${v.replace(/"/g, '')}"`)
      .join(',');

  const orParts: string[] = [];
  if (primaryMuscle) {
    const list = inList(primaryMuscle);
    if (list) orParts.push(`primary_muscle.in.(${list})`);
  }
  if (muscleGroup) {
    const list = inList(muscleGroup);
    if (list) orParts.push(`muscle_group.in.(${list})`);
  }
  if (orParts.length) {
    dbQuery = dbQuery.or(orParts.join(','));
  }

  const { data, error } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
