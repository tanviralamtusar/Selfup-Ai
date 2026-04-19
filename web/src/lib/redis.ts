import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Prevent flood of connection errors in the terminal
let hasLoggedError = false;

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  }
})

redis.on('error', (err) => {
  if (!hasLoggedError) {
    console.error('[Redis] Connection failing. Background AI tasks will be queued until Redis is running.')
    console.error('Target URL:', redisUrl)
    hasLoggedError = true;
    
    // Reset after 30 seconds to allow another warning if it's still down
    setTimeout(() => { hasLoggedError = false }, 30000);
  }
})

redis.on('connect', () => {
  console.log('[Redis] Connected successfully - Intelligence Queue Active')
  hasLoggedError = false;
})
