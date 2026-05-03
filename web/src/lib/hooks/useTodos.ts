import { useCallback, useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

// ── Types ──

export interface Todo {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'general' | 'fitness' | 'skills' | 'style' | 'system'
  source: string
  due_date: string | null
  scheduled_time: string | null
  subtasks: Array<{ title: string; is_completed: boolean }>
  require_all_subtasks: boolean
  is_completed: boolean
  completed_at: string | null
  xp_reward: number
  xp_penalty: number
  created_at: string
  // Enriched by API
  is_overdue?: boolean
}

interface CreateTodoInput {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  due_date?: string
  scheduled_time?: string
  subtasks?: Array<{ title: string; is_completed: boolean }>
  require_all_subtasks?: boolean
}

// ── Hook ──

export const useTodos = () => {
  const { session } = useAuthStore()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }), [session])

  // Fetch todos (incomplete by default)
  const fetchTodos = useCallback(async (showCompleted = false) => {
    if (!session?.access_token) return

    setLoading(true)
    setError(null)
    try {
      const url = showCompleted ? '/api/todos?completed=true' : '/api/todos'
      const res = await fetch(url, { headers: headers() })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch todos')
      
      const data = Array.isArray(json.data) ? json.data : []
      setTodos(data)
    } catch (err: any) {
      console.error('[useTodos] fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session, headers])

  // Create todo
  const createTodo = useCallback(async (input: CreateTodoInput) => {
    if (!session?.access_token) return null

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create todo')

      setTodos(prev => [...prev, json.data])
      toast.success('To-do created')
      return json.data
    } catch (err: any) {
      console.error('[useTodos] create error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Complete todo
  const completeTodo = useCallback(async (id: string) => {
    if (!session?.access_token) return null

    // Optimistic update
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, is_completed: true, completed_at: new Date().toISOString() } : t
    ))

    try {
      const res = await fetch(`/api/todos/${id}/complete`, {
        method: 'POST',
        headers: headers(),
      })
      const json = await res.json()
      if (!res.ok) {
        // Revert
        setTodos(prev => prev.map(t =>
          t.id === id ? { ...t, is_completed: false, completed_at: null } : t
        ))
        throw new Error(json.error || 'Failed to complete todo')
      }

      const xp = json.data?.xp_awarded || 0
      if (xp > 0) toast.success(`To-do completed! +${xp} XP ✅`)
      else toast.success('To-do completed!')

      return json.data
    } catch (err: any) {
      console.error('[useTodos] complete error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Update todo
  const updateTodo = useCallback(async (id: string, updates: Partial<CreateTodoInput>) => {
    if (!session?.access_token) return null

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update todo')

      setTodos(prev => prev.map(t => t.id === id ? json.data : t))
      return json.data
    } catch (err: any) {
      console.error('[useTodos] update error:', err)
      toast.error(err.message)
      return null
    }
  }, [session, headers])

  // Delete todo
  const deleteTodo = useCallback(async (id: string) => {
    if (!session?.access_token) return false

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: headers(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete todo')

      setTodos(prev => prev.filter(t => t.id !== id))
      toast.success('To-do deleted')
      return true
    } catch (err: any) {
      console.error('[useTodos] delete error:', err)
      toast.error(err.message)
      return false
    }
  }, [session, headers])

  // Auto-fetch on mount
  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // Computed values
  const safeTodos = Array.isArray(todos) ? todos : []
  const overdueCount = safeTodos.filter(t => t.is_overdue).length
  const remainingCount = safeTodos.filter(t => !t.is_completed).length
  const completedCount = safeTodos.filter(t => t.is_completed).length

  return {
    todos,
    loading,
    error,
    overdueCount,
    remainingCount,
    completedCount,
    fetchTodos,
    createTodo,
    completeTodo,
    updateTodo,
    deleteTodo,
  }
}
