import { useCallback, useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

// ── Types ──

export interface Habit {
  id: string
  user_id: string
  title: string
  description: string | null
  category: 'general' | 'fitness' | 'skills' | 'style' | 'system'
  source: string
  reset_type: 'daily' | 'weekly' | 'monthly'
  is_indefinite: boolean
  end_date: string | null
  current_streak: number
  longest_streak: number
  is_completed_this_cycle: boolean
  completed_at: string | null
  xp_reward: number
  hp_penalty: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CreateHabitInput {
  title: string
  description?: string
  category?: string
  reset_type?: 'daily' | 'weekly' | 'monthly'
  is_indefinite?: boolean
  end_date?: string
}

// ── Hook ──

export const useHabits = () => {
  const { session } = useAuthStore()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }), [session])

  // Fetch habits
  const fetchHabits = useCallback(async () => {
    if (!session?.access_token) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/habits', { headers: headers() })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch habits')
      setHabits(json.data || [])
    } catch (err: any) {
      console.error('[useHabits] fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session, headers])

  // Create habit
  const createHabit = useCallback(async (input: CreateHabitInput) => {
    if (!session?.access_token) return null

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create habit')

      setHabits(prev => [...prev, json.data])
      toast.success('Habit created')
      return json.data
    } catch (err: any) {
      console.error('[useHabits] create error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Complete habit (log for this cycle)
  const completeHabit = useCallback(async (id: string) => {
    if (!session?.access_token) return null

    // Optimistic update
    setHabits(prev => prev.map(h =>
      h.id === id ? {
        ...h,
        is_completed_this_cycle: true,
        completed_at: new Date().toISOString(),
        current_streak: h.current_streak + 1,
        longest_streak: Math.max(h.current_streak + 1, h.longest_streak),
      } : h
    ))

    try {
      const res = await fetch(`/api/habits/${id}/log`, {
        method: 'POST',
        headers: headers(),
      })
      const json = await res.json()
      if (!res.ok) {
        // Revert optimistic update
        setHabits(prev => prev.map(h =>
          h.id === id ? {
            ...h,
            is_completed_this_cycle: false,
            completed_at: null,
            current_streak: h.current_streak - 1,
            longest_streak: h.longest_streak, // don't revert longest
          } : h
        ))
        throw new Error(json.error || 'Failed to log habit')
      }

      const xp = json.data?.xp_awarded || 0
      const streak = json.data?.current_streak || 0
      if (xp > 0) toast.success(`Habit completed! +${xp} XP 🔥 Streak: ${streak}`)
      else toast.success('Habit completed!')

      return json.data
    } catch (err: any) {
      console.error('[useHabits] complete error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Update habit
  const updateHabit = useCallback(async (id: string, updates: Partial<CreateHabitInput>) => {
    if (!session?.access_token) return null

    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update habit')

      setHabits(prev => prev.map(h => h.id === id ? json.data : h))
      return json.data
    } catch (err: any) {
      console.error('[useHabits] update error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Delete habit
  const deleteHabit = useCallback(async (id: string) => {
    if (!session?.access_token) return false

    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: headers(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete habit')

      setHabits(prev => prev.filter(h => h.id !== id))
      toast.success('Habit deleted')
      return true
    } catch (err: any) {
      console.error('[useHabits] delete error:', err)
      toast.error(err.message)
      return false
    }
  }, [session, headers])

  // Auto-fetch on mount
  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  // Computed values
  const completedCount = habits.filter(h => h.is_completed_this_cycle).length
  const totalCount = habits.length
  const totalStreak = habits.reduce((sum, h) => sum + h.current_streak, 0)

  return {
    habits,
    loading,
    error,
    completedCount,
    totalCount,
    totalStreak,
    fetchHabits,
    createHabit,
    completeHabit,
    updateHabit,
    deleteHabit,
  }
}
