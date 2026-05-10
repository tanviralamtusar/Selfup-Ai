export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[SelfUp] Booting Pathfinder Engine v3.0 Intelligence...')
    
    // 1. Initialize Scheduler (Proactive Alerts & Weekly Summaries)
    const { initScheduler } = await import('./lib/ai/scheduler')
    initScheduler().catch(err => console.error('[Instrumentation] Scheduler failed:', err))

    // 2. Setup Worker (Queue processing)
    const { setupAiWorker } = await import('./lib/worker')
    // setupAiWorker() // Still disabled as we use direct bypass in queue.ts
    
    console.log('[SelfUp] Intelligence Systems initialized.')
  }
}
