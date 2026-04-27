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

import { executeAiTask } from './worker'
// Singleton for the queue
const globalForQueue = global as unknown as { aiQueue: Queue | undefined }

export const aiQueue = globalForQueue.aiQueue ?? (redis ? new Queue(AI_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
}) : null)

if (process.env.NODE_ENV !== 'production') globalForQueue.aiQueue = aiQueue as any

if (aiQueue) {
  aiQueue.on('error', (err) => {
    // Silent
  })
}

/**
 * Helper to add a job to the AI queue
 * UPDATED: Now executes directly to remove Redis dependency for now
 */
export async function addAiTask(data: AiJobData) {
  console.log(`[Queue Bypass] Executing ${data.type} directly...`)
  // We don't await this if we want it to be "background", 
  // but in serverless/Next.js it's safer to await or use a different mechanism.
  // For now, let's await it to ensure completion.
  return await executeAiTask(data)
}
