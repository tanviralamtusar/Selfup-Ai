// import { Queue } from 'bullmq'
import type { Queue } from 'bullmq'

import { redis } from '@/lib/redis'

export type AiJobType =
  | 'roadmap'
  | 'fitness_plan'
  | 'fitness_plan_v2'
  | 'fitness_interview_complete'
  | 'fitness_adaptation_check'
  | 'nutrition_plan'
  | 'style_advice'
  | 'chat_analysis'
  | 'initial_plan'
  // V3 job types
  | 'weekly_summary_generate'
  | 'embed_message'
  | 'memory_extraction'
  | 'proactive_alert_check'
  | 'plan_adaptation_check'
  | 'test_generate'
  // Skills v2 job types
  | 'skill_roadmap'
  | 'skill_test_generate'
  | 'skill_test_evaluate'

export interface AiJobData {
  userId: string
  type: AiJobType
  payload: any
}

const AI_QUEUE_NAME = 'ai-tasks'

import { executeAiTask } from './worker'
// Singleton for the queue
const globalForQueue = global as unknown as { aiQueue: Queue | undefined }

export const aiQueue = globalForQueue.aiQueue ?? (redis ? null /* new Queue(AI_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
}) */ : null)

if (process.env.NODE_ENV !== 'production') globalForQueue.aiQueue = aiQueue as any

if (aiQueue) {
  aiQueue.on('error', (err) => {
    // Silent
  })
}

/**
 * Helper to add a job to the AI queue.
 * Currently executes directly (Redis bypass) for simplicity.
 */
export async function addAiTask(data: AiJobData) {
  console.log(`[Queue Bypass] Executing ${data.type} directly...`)
  return await executeAiTask(data)
}
