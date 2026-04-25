import { Worker, Job } from 'bullmq'
import { redis } from '@/lib/redis'
import { AiJobData } from './queue'
import { generateResponse } from './gemma'
import { supabase } from './supabase'

const AI_QUEUE_NAME = 'ai-tasks'

export function setupAiWorker() {
  const worker = new Worker(
    AI_QUEUE_NAME,
    async (job: Job<AiJobData>) => {
      const { userId, type, payload, queueId } = job.data

      console.log(`[AI Worker] Processing job ${job.id} for user ${userId} (${type})`)

      try {
        // 1. Update status to 'processing' in DB if we have a queueId
        if (queueId) {
          await supabase
            .from('ai_queue')
            .update({ status: 'processing' })
            .eq('id', queueId)
        }

        // 2. Perform AI Task
        let result = ''
        switch (type) {
          case 'roadmap': {
            const prompt = `You are a world-class mentor. Generate a structured learning roadmap for the skill: "${payload.skillName}" in the category: "${payload.category || 'General'}". 
            Target level: ${payload.targetLevel || 'Mastery'}.
            The roadmap should consist of 8-10 specific, actionable milestones.
            Respond ONLY with a valid JSON array of objects, each with these exact keys: "title", "description", "estimated_hours".
            Do not include any intro or outro text.`
            
            const rawResponse = await generateResponse(prompt)
            if (!rawResponse) throw new Error('No response from AI');
            
            // Clean and parse JSON
            const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
            let milestones = []
            try {
              milestones = JSON.parse(cleanJson)
            } catch (pErr) {
              console.error('[AI Worker] JSON Parse Error:', pErr, cleanJson)
              throw new Error('Failed to parse AI roadmap response')
            }

            // 1. Create Roadmap
            const { data: roadmap, error: roadmapError } = await supabase
              .from('skill_roadmaps')
              .insert({
                skill_id: payload.skillId,
                title: `${payload.skillName} Growth Path`,
                description: `AI-generated roadmap to master ${payload.skillName}.`,
                is_ai_generated: true
              })
              .select()
              .single()
            
            if (roadmapError) throw roadmapError

            // 2. Create Milestones
            const milestoneEntries = milestones.map((m: any, idx: number) => ({
              roadmap_id: roadmap.id,
              title: m.title,
              description: m.description,
              order_index: idx + 1,
              estimated_hours: m.estimated_hours || 1,
              is_completed: false
            }))

            const { error: milestoneError } = await supabase
              .from('skill_milestones')
              .insert(milestoneEntries)
            
            if (milestoneError) throw milestoneError

            result = `Success: Generated roadmap with ${milestones.length} milestones.`
            break
          }
          case 'style_advice': {
            const prompt = `You are an elite fashion AI stylist.
            The user needs an outfit for this occasion: "${payload.occasion}".
            Their body type: "${payload.body_type}".
            Style preferences: "${(payload.style_preferences || []).join(', ')}".
            Budget: "${payload.budget_range}".
            
            Create a coordinated look with 4 items: Top, Bottom, Shoes, Accessory.
            Return ONLY a valid JSON array of objects, where each object has:
            "type" (e.g. "top", "bottom", "shoes", "accessory"),
            "name" (specific name of the item),
            "description" (why it works),
            "color",
            "estimated_price" (a number matching the budget).
            No markdown blocks, no intro, no outro, strictly JSON.`

            const rawResponse = await generateResponse(prompt)
            if (!rawResponse) throw new Error('No response from AI');
            const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
            let items = []
            try {
              items = JSON.parse(cleanJson)
            } catch (pErr) {
              console.error('[AI Worker] Style JSON Parse Error:', pErr, cleanJson)
              throw new Error('Failed to parse style AI response')
            }

            const { error: styleError } = await supabase
              .from('style_recommendations')
              .insert({
                user_id: userId,
                occasion: payload.occasion,
                items: items,
                is_ai_generated: true,
                rating: null
              })

            if (styleError) throw styleError

            result = `Success: Generated style with ${items.length} items.`
            break
          }
          case 'fitness_plan': {
            const prompt = `You are a world-class personal trainer.
            Create a structured workout plan.
            Target goal: "${payload.goal}".
            Days per week: ${payload.days}.

            Return ONLY a valid JSON object with the following structure:
            {
              "name": "Title of the plan",
              "description": "Short explanation",
              "workouts": [
                {
                  "day_number": 1,
                  "name": "E.g., Upper Body Focus",
                  "muscle_groups": ["Chest", "Back"],
                  "exercises": [
                    { "name": "Bench Press", "sets": 3, "reps": "8-12", "rest_seconds": 90, "notes": "Keep core tight" }
                  ]
                }
              ]
            }
            No markdown blocks, no text outside JSON.`
            
            const rawResponse = await generateResponse(prompt)
            if (!rawResponse) throw new Error('No response from AI');
            const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
            let planData = null
            try {
              planData = JSON.parse(cleanJson)
            } catch (err) {
              console.error('[AI Worker] Fitness JSON Parse Error:', err, cleanJson)
              throw new Error('Failed to parse fitness AI response')
            }

            // 1. Insert Workout Plan
            const { data: planRow, error: planError } = await supabase
              .from('workout_plans')
              .insert({
                user_id: userId,
                name: planData.name,
                description: planData.description,
                goal: payload.goal,
                days_per_week: payload.days,
                difficulty: 'intermediate',
                is_ai_generated: true,
                is_active: true
              })
              .select().single()

            if (planError) throw planError

            // 2. Insert Workout Days
            for (const d of planData.workouts) {
              const { data: dayRow, error: dayError } = await supabase
                .from('workout_days')
                .insert({
                  plan_id: planRow.id,
                  day_number: d.day_number,
                  name: d.name,
                  muscle_groups: d.muscle_groups || []
                })
                .select().single()

              if (dayError) throw dayError

              // We'll skip exercise relational mapping for now if "exercises" table is strict,
              // or just upsert the exercises. Since we auto-generated schema, let's upsert the exercises.
              for (const ex of d.exercises) {
                // Upsert exercise
                const { data: exRow, error: exError } = await supabase
                  .from('exercises')
                  .upsert({
                    name: ex.name,
                    muscle_group: (d.muscle_groups || ['general'])[0],
                    difficulty: 'intermediate'
                  }, { onConflict: 'name' })
                  .select().single()

                if (!exError && exRow) {
                  await supabase.from('workout_day_exercises').insert({
                    workout_day_id: dayRow.id,
                    exercise_id: exRow.id,
                    sets: ex.sets || 3,
                    reps: ex.reps || "10",
                    rest_seconds: ex.rest_seconds || 60,
                    notes: ex.notes || ""
                  })
                }
              }
            }

            result = `Success: Generated fitness plan ${planData.name}.`
            break
          }
          case 'initial_plan': {
            const prompt = `You are Nova, an elite AI life coach.
            A new user has just completed onboarding.
            Their goals: ${(payload.goals || []).join(', ')}.
            Their preferred interaction style: ${payload.persona}.
            Their answers to your onboarding questions: ${JSON.stringify(payload.answers || {})}.

            Generate an initial starter plan consisting of a few easy-to-start habits, tasks, and quests.
            Return ONLY a valid JSON object with the following structure:
            {
              "habits": [
                { "title": "Drink Water", "description": "Start the day with a glass of water", "frequency": "daily", "target_days": [0,1,2,3,4,5,6] }
              ],
              "tasks": [
                { "title": "Setup workspace", "category": "productivity" }
              ],
              "quests": [
                { "title": "First Steps", "description": "Complete your first task and habit to earn this." }
              ]
            }
            Generate 2-3 habits, 2-3 tasks, and 1 starter quest.
            Do not include any markdown blocks or text outside JSON. Strictly valid JSON.`

            const rawResponse = await generateResponse(prompt)
            if (!rawResponse) throw new Error('No response from AI');
            const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
            let initPlan = null
            try {
              initPlan = JSON.parse(cleanJson)
            } catch (err) {
              console.error('[AI Worker] Initial Plan JSON Parse Error:', err, cleanJson)
              throw new Error('Failed to parse initial plan AI response')
            }

            // Insert Habits
            if (initPlan.habits && initPlan.habits.length > 0) {
              const habitEntries = initPlan.habits.map((h: any) => ({
                user_id: userId,
                title: h.title,
                description: h.description,
                frequency: h.frequency || 'daily',
                target_days: h.target_days || [0,1,2,3,4,5,6],
                xp_reward: 5,
                coin_reward: 2,
                is_active: true
              }))
              await supabase.from('habits').insert(habitEntries)
            }

            // Insert Tasks
            if (initPlan.tasks && initPlan.tasks.length > 0) {
              const taskEntries = initPlan.tasks.map((t: any) => ({
                user_id: userId,
                title: t.title,
                category: t.category,
                priority: 'medium',
                status: 'pending',
                xp_reward: 5,
                coin_reward: 1
              }))
              await supabase.from('tasks').insert(taskEntries)
            }

            // Insert Quests
            if (initPlan.quests && initPlan.quests.length > 0) {
              for (const q of initPlan.quests) {
                // Insert Quest
                const { data: questRow, error: questError } = await supabase
                  .from('quests')
                  .insert({
                    user_id: userId, // assigning directly to user
                    title: q.title,
                    description: q.description,
                    category: 'general',
                    quest_type: 'solo',
                    is_ai_generated: true,
                    xp_reward: 50,
                    coin_reward: 20,
                    duration_days: 3
                  })
                  .select()
                  .single()

                if (!questError && questRow) {
                  // Assign Quest
                  await supabase.from('user_quests').insert({
                    user_id: userId,
                    quest_id: questRow.id,
                    status: 'active'
                  })
                }
              }
            }

            result = 'Success: Initial plan generated.'
            break
          }
          default:
            result = (await generateResponse(`Assistant request: ${type} with data: ${JSON.stringify(payload)}`)) || 'No response';
        }

        // 3. Update status to 'done' and store result
        if (queueId) {
          await supabase
            .from('ai_queue')
            .update({ 
              status: 'completed', 
              result: result,
              processed_at: new Date().toISOString()
            })
            .eq('id', queueId)
        }

        return result

      } catch (err: any) {
        console.error(`[AI Worker Error] Job ${job.id} failed:`, err)
        
        if (queueId) {
          await supabase
            .from('ai_queue')
            .update({ 
              status: 'failed',
              result: err.message || 'Unknown error'
            })
            .eq('id', queueId)
        }
        
        throw err
      }
    },
    { 
      connection: redis,
      concurrency: 2, // Limit concurrent AI calls to manage rate limit
    }
  )

  worker.on('completed', (job) => {
    console.log(`[AI Worker] Job ${job.id} completed successfully.`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[AI Worker] Job ${job?.id} failed with error: ${err.message}`)
  })

  worker.on('error', (err) => {
    // Silent - the redis instance already handles logging a throttled warning
  })

  return worker
}
