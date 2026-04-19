export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupAiWorker } = await import('./lib/worker')
    
    console.log('[SelfUp] Booting Background AI Intelligence Queue...')
    // setupAiWorker()
    console.log('[SelfUp] Background AI Queue is currently DISABLED.')
  }
}
