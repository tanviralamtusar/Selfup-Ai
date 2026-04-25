import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { GamificationService } from '@/lib/gamification.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // 1. Try to fetch existing profile
    const { data: profile, error: profileError } = await authSupabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // 2. If profile exists, check/update streak and return it
    if (profile) {
      // Trigger streak update if not already updated today
      const today = new Date().toISOString().split('T')[0]
      if (profile.streak_last_date !== today) {
        const gamification = new GamificationService(authSupabase)
        await gamification.updateOverallStreak(user.id)
        
        // Re-fetch profile to get updated streak data
        const { data: updatedProfile } = await authSupabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (updatedProfile) return NextResponse.json(updatedProfile)
      }
      return NextResponse.json(profile)
    }

    // 3. If profile doesn't exist, auto-create a default one
    // This handles users who signed up but missed the profile creation step
    console.log(`[User API] Profile not found for ${user.id}, creating default...`)
    
    const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pathfinder'
    const defaultUsername = user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`

    const { data: newProfile, error: createError } = await authSupabase
      .from('user_profiles')
      .insert({
        id: user.id,
        username: defaultUsername,
        display_name: defaultName,
        ai_coins: 1000,
        level: 1,
        xp: 0,
        xp_to_next_level: 100,
        onboarding_done: false, // Force onboarding if missing
        ai_persona_name: 'System',
        ai_persona_style: 'friendly',
        theme: 'dark'
      })
      .select()
      .single()

    if (createError) {
      console.error('[User API] Failed to auto-create profile:', createError)
      throw createError
    }

    return NextResponse.json(newProfile)
  } catch (err: any) {
    console.error('[User Profile Fetch Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
