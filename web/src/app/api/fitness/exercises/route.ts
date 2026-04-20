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
  const muscleGroup = searchParams.get('muscle_group');

  let dbQuery = supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`);
  }

  if (muscleGroup) {
    dbQuery = dbQuery.eq('muscle_group', muscleGroup);
  }

  const { data, error } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
