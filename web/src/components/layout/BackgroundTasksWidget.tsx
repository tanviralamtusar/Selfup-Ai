'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Activity, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface AiQueueItem {
  id: string
  action_type: string
  payload: any
  status: 'pending' | 'processing' | 'done' | 'failed'
  error: string | null
  created_at: string
  processed_at: string | null
}

export function BackgroundTasksWidget() {
  const { session } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)

  const { data: tasks = [], isLoading } = useQuery<AiQueueItem[]>({
    queryKey: ['ai-queue'],
    queryFn: async () => {
      if (!session) return []
      const res = await fetch('/api/ai/queue', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch AI tasks')
      const json = await res.json()
      return json.data || []
    },
    enabled: !!session,
    refetchInterval: 5000
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const activeCount = tasks.filter(t => t.status === 'processing' || t.status === 'pending').length

  return (
    <div className="relative" ref={widgetRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
        title="Background Tasks"
      >
        <Activity className={cn("w-[18px] h-[18px]", activeCount > 0 ? 'text-primary' : '')} />
        {activeCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-popover border border-border shadow-md rounded-xl overflow-hidden z-50">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Background Tasks</h3>
            <div className="flex items-center gap-2">
              {isLoading && activeCount === 0 && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
              <a
                href="/analysis"
                className="text-xs text-primary hover:underline"
              >
                Analysis
              </a>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {tasks.length === 0 && !isLoading && (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No active background tasks</p>
              </div>
            )}

            {tasks.map(task => (
              <div key={task.id} className="p-2.5 rounded-lg hover:bg-muted transition-colors flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {task.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                  {task.status === 'pending' && <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                  {task.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  {task.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate capitalize">
                    {task.action_type.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-xs",
                      task.status === 'done' ? 'text-emerald-400' :
                      task.status === 'failed' ? 'text-destructive' :
                      'text-muted-foreground'
                    )}>
                      {task.status}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.status === 'failed' ? task.error : new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
