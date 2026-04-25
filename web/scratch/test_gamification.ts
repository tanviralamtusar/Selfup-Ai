
import { createClient } from '@supabase/supabase-js'
import { GamificationService } from '../src/lib/gamification.service'
import * as dotenv from 'dotenv'

dotenv.config()

async function testGamification() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const gService = new GamificationService(supabase)
  
  const userId = '00000000-0000-0000-0000-000000000000' // Placeholder for testing
  
  console.log('Testing XP Addition...')
  const result = await gService.addXp(userId, 150)
  console.log('Result:', JSON.stringify(result, null, 2))
}

// testGamification()
