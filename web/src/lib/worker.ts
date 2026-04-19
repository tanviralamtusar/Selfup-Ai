import { Worker, Job } from 'bullmq'
import { redis } from './redis'
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
          case 'roadmap':
            result = await generateResponse(`Generate a detailed skill roadmap for: ${payload.skillName}. Target level: ${payload.targetLevel || 'Intermediate'}.`)
            break
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

  return worker
}
