import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
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
