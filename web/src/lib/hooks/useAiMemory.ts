import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface MemoryEntry {
  key: string
  value: string
  source?: string
}

export const useAiMemory = () => {
  const { session } = useAuthStore()

  const saveMemory = useCallback(async (key: string, value: string, source = 'user-input') => {
    if (!session?.access_token) {
      toast.error('Not authenticated')
      return false
    }

    try {
      const res = await fetch('/api/ai/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ memoryKey: key, memoryValue: value, source })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save memory')
      }

      toast.success(`Memory "${key}" saved`)
      return true
    } catch (err: any) {
      console.error('Failed to save memory:', err)
      toast.error(err.message)
      return false
    }
  }, [session])

  const saveMemoryBatch = useCallback(async (memories: MemoryEntry[]) => {
    if (!session?.access_token) {
      toast.error('Not authenticated')
      return false
    }

    try {
      const res = await fetch('/api/ai/memory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          memories: memories.map(m => ({
            key: m.key,
            value: m.value,
            source: m.source || 'batch-update'
          }))
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save memories')
      }

      toast.success(`${memories.length} memories saved`)
      return true
    } catch (err: any) {
      console.error('Failed to save memory batch:', err)
      toast.error(err.message)
      return false
    }
  }, [session])

  const fetchMemory = useCallback(async (): Promise<Record<string, string> | null> => {
    if (!session?.access_token) {
      toast.error('Not authenticated')
      return null
    }

    try {
      const res = await fetch('/api/ai/memory', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!res.ok) {
        throw new Error('Failed to fetch memory')
      }

      return await res.json()
    } catch (err: any) {
      console.error('Failed to fetch memory:', err)
      return null
    }
  }, [session])

  const clearMemory = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Not authenticated')
      return false
    }

    try {
      const res = await fetch('/api/ai/memory', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-confirm-memory-clear': 'true'
        }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to clear memory')
      }

      toast.success('All memory cleared')
      return true
    } catch (err: any) {
      console.error('Failed to clear memory:', err)
      toast.error(err.message)
      return false
    }
  }, [session])

  return { saveMemory, saveMemoryBatch, fetchMemory, clearMemory }
}
