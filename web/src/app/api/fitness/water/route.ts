import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { QuestService } from '@/lib/quest.service'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('logged_date', date)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Water logs fetch error:', error.message)
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
    const { amount_ml, logged_date } = body

    const { data, error } = await supabase
      .from('water_logs')
      .insert({
        user_id: session.user.id,
        amount_ml,
        logged_date: logged_date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) throw error

    // Track quest progress for water-related quests
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const userDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    const questService = new QuestService(userDb)
    await questService.checkAndUpdateProgress(session.user.id, 'water', amount_ml)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Water log create error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
