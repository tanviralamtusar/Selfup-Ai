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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Fetch food logs for the date
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('logged_date', date)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Nutrition logs fetch error:', error.message)
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
      meal_type,
      food_name,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      logged_date
    } = body

    const { data, error } = await supabase
      .from('food_logs')
      .insert({
        user_id: session.user.id,
        meal_type,
        food_name,
        calories: calories || 0,
        protein_g: protein_g || 0,
        carbs_g: carbs_g || 0,
        fat_g: fat_g || 0,
        logged_date: logged_date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Nutrition log create error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
