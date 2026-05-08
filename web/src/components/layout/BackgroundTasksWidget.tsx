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

  // Fetch tasks
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
    refetchInterval: 5000 // Poll every 5 seconds
  })

  // Close on outside click
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
        className="p-2 rounded bg-blue-500/5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all relative border border-blue-500/10 group/task"
        title="Background Tasks"
      >
        <Activity className={`w-[18px] h-[18px] group-hover/task:scale-110 transition-transform ${activeCount > 0 ? 'text-blue-400' : 'text-blue-500/40'}`} />
        {activeCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse border border-slate-950" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-slate-950/95 backdrop-blur-2xl border border-blue-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_20px_rgba(59,130,246,0.1)] rounded-xl overflow-hidden z-50">
          <div className="p-3 border-b border-blue-500/10 bg-blue-500/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-blue-50 uppercase tracking-widest italic">Background Tasks</h3>
            <div className="flex items-center gap-3">
              {isLoading && activeCount === 0 && <Loader2 className="w-3 h-3 text-blue-500/40 animate-spin" />}
              <a 
                href="/analysis" 
                className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest italic flex items-center gap-1"
              >
                Analysis
              </a>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {tasks.length === 0 && !isLoading && (
              <div className="p-8 text-center">
                <p className="text-[9px] font-black text-blue-500/30 uppercase tracking-[0.3em] italic">No Active Background Tasks</p>
              </div>
            )}
 
            {tasks.map(task => (
              <div key={task.id} className="p-3 rounded-lg hover:bg-blue-500/5 transition-colors flex items-start gap-3 border border-transparent hover:border-blue-500/10 group/item">
                <div className="mt-1">
                  {task.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                  {task.status === 'pending' && <Clock className="w-3.5 h-3.5 text-blue-500/40" />}
                  {task.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  {task.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-blue-50 uppercase tracking-wide italic truncate group-hover/item:text-blue-300 transition-colors">
                    {task.action_type.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[7px] font-black uppercase tracking-widest",
                      task.status === 'done' ? 'text-emerald-500/60' :
                      task.status === 'failed' ? 'text-rose-500/60' :
                      'text-blue-500/40'
                    )}>
                      {task.status}
                    </span>
                    <span className="text-[7px] text-blue-500/20">•</span>
                    <p className="text-[7px] font-bold text-blue-500/40 uppercase tracking-tighter truncate">
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
