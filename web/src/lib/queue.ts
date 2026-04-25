import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

export type AiJobType = 'roadmap' | 'fitness_plan' | 'nutrition_plan' | 'style_advice' | 'chat_analysis' | 'initial_plan'

export interface AiJobData {
  userId: string
  type: AiJobType
  payload: any
  queueId?: string // Supabase ai_queue.id
}

const AI_QUEUE_NAME = 'ai-tasks'

// Singleton for the queue
const globalForQueue = global as unknown as { aiQueue: Queue | undefined }

export const aiQueue = globalForQueue.aiQueue ?? new Queue(AI_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
})

if (process.env.NODE_ENV !== 'production') globalForQueue.aiQueue = aiQueue

aiQueue.on('error', (err) => {
  // Silent - let the redis singleton handle the throttled logging
})

/**
 * Helper to add a job to the AI queue
 */
export async function addAiTask(data: AiJobData) {
  return await aiQueue.add(`${data.type}:${data.userId}`, data)
}
