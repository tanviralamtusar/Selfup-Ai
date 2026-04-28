import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables manually since we aren't running inside Next.js process
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { setupAiWorker } from './lib/worker'

// Prevent Node from exiting right away
console.log('🚀 [SelfUp] Booting Background AI Intelligence Queue...')
const worker = setupAiWorker()

process.on('SIGINT', async () => {
  console.log('\n🛑 [SelfUp] Gracefully shutting down AI Worker...')
  if (worker) {
    await worker.close()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 [SelfUp] Gracefully shutting down AI Worker...')
  if (worker) {
    await worker.close()
  }
  process.exit(0)
})
