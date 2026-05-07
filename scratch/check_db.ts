import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkConstraints() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: `
      SELECT
          conname AS constraint_name,
          pg_get_constraintdef(c.oid) AS constraint_definition
      FROM
          pg_constraint c
      JOIN
          pg_namespace n ON n.oid = c.connamespace
      WHERE
          contype = 'c'
          AND conname = 'workout_plans_plan_type_check';
    `
  })

  if (error) {
    // If rpc execute_sql doesn't exist, try a simple select if we have a table to exploit
    console.error('Error fetching constraints:', error)
    
    // Fallback: try to just insert a few test values to see what fails
    console.log('Testing values...')
    for (const type of ['ongoing', 'fixed', 'full', 'diet_only', 'fixed_duration', 'full_complete']) {
      const { error: insError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: '7279d153-cb90-4055-9a68-856c2950d1a0', // Use the user ID from the log
          name: 'Test',
          goal: 'Test',
          plan_type: type,
          status: 'deactivated'
        })
      if (insError) {
        console.log(`Value "${type}" FAILED: ${insError.message}`)
      } else {
        console.log(`Value "${type}" PASSED`)
        // Clean up
        await supabase.from('workout_plans').delete().eq('plan_type', type).eq('name', 'Test')
      }
    }
  } else {
    console.log('Constraint definition:', data)
  }
}

checkConstraints()
