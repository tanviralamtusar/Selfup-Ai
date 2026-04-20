import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', session.user.id)
      .order('logged_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Body metrics fetch error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      logged_date,
      weight_kg,
      height_cm,
      chest_cm,
      waist_cm,
      hip_cm,
      body_fat_pct,
      notes
    } = body

    const { data, error } = await supabase
      .from('body_metrics')
      .insert({
        user_id: session.user.id,
        logged_date: logged_date || new Date().toISOString().split('T')[0],
        weight_kg,
        height_cm,
        chest_cm,
        waist_cm,
        hip_cm,
        body_fat_pct,
        notes
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Body metrics create error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
