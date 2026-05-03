import { useCallback, useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

// ── Types ──

export interface Daily {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'general' | 'fitness' | 'skills' | 'style' | 'system'
  source: string
  repeat_type: 'daily' | 'weekly'
  repeat_days: string[] | null
  scheduled_time: string | null
  expires_on: string | null
  subtasks: Array<{ title: string; is_completed: boolean }>
  require_all_subtasks: boolean
  is_completed: boolean
  completed_at: string | null
  xp_reward: number
  xp_penalty: number
  created_at: string
}

interface CreateDailyInput {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  repeat_type?: 'daily' | 'weekly'
  repeat_days?: string[]
  scheduled_time?: string
  expires_on?: string
  subtasks?: Array<{ title: string; is_completed: boolean }>
  require_all_subtasks?: boolean
}

// ── Hook ──

export const useDailies = () => {
  const { session } = useAuthStore()
  const [dailies, setDailies] = useState<Daily[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }), [session])

  // Fetch dailies
  const fetchDailies = useCallback(async () => {
    if (!session?.access_token) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dailies', { headers: headers() })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch dailies')
      setDailies(json.data || [])
    } catch (err: any) {
      console.error('[useDailies] fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session, headers])

  // Create daily
  const createDaily = useCallback(async (input: CreateDailyInput) => {
    if (!session?.access_token) return null

    try {
      const res = await fetch('/api/dailies', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create daily')

      setDailies(prev => [...prev, json.data])
      toast.success('Daily created')
      return json.data
    } catch (err: any) {
      console.error('[useDailies] create error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Complete daily
  const completeDaily = useCallback(async (id: string) => {
    if (!session?.access_token) return null

    // Optimistic update
    setDailies(prev => prev.map(d =>
      d.id === id ? { ...d, is_completed: true, completed_at: new Date().toISOString() } : d
    ))

    try {
      const res = await fetch(`/api/dailies/${id}/complete`, {
        method: 'POST',
        headers: headers(),
      })
      const json = await res.json()
      if (!res.ok) {
        // Revert optimistic update
        setDailies(prev => prev.map(d =>
          d.id === id ? { ...d, is_completed: false, completed_at: null } : d
        ))
        throw new Error(json.error || 'Failed to complete daily')
      }

      const xp = json.data?.xp_awarded || 0
      if (xp > 0) toast.success(`Daily completed! +${xp} XP 🎉`)
      else toast.success('Daily completed!')

      return json.data
    } catch (err: any) {
      console.error('[useDailies] complete error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Update daily
  const updateDaily = useCallback(async (id: string, updates: Partial<CreateDailyInput>) => {
    if (!session?.access_token) return null

    try {
      const res = await fetch(`/api/dailies/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update daily')

      setDailies(prev => prev.map(d => d.id === id ? json.data : d))
      return json.data
    } catch (err: any) {
      console.error('[useDailies] update error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Delete daily
  const deleteDaily = useCallback(async (id: string) => {
    if (!session?.access_token) return false

    try {
      const res = await fetch(`/api/dailies/${id}`, {
        method: 'DELETE',
        headers: headers(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete daily')

      setDailies(prev => prev.filter(d => d.id !== id))
      toast.success('Daily deleted')
      return true
    } catch (err: any) {
      console.error('[useDailies] delete error:', err)
      toast.error(err.message)
      return false
    }
  }, [session, headers])

  // Auto-fetch on mount
  useEffect(() => {
    fetchDailies()
  }, [fetchDailies])

  // Computed values
  const completedCount = dailies.filter(d => d.is_completed).length
  const totalCount = dailies.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return {
    dailies,
    loading,
    error,
    completedCount,
    totalCount,
    completionRate,
    fetchDailies,
    createDaily,
    completeDaily,
    updateDaily,
    deleteDaily,
  }
}
