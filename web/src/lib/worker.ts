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
          case 'fitness_plan':
            result = await generateResponse(`Generate a workout plan for a ${payload.goal} goal. Days per week: ${payload.days}.`)
            break
          default:
            result = await generateResponse(`Assistant request: ${type} with data: ${JSON.stringify(payload)}`)
        }

        // 3. Update status to 'done' and store result
        if (queueId) {
          await supabase
            .from('ai_queue')
            .update({ 
              status: 'done', 
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
