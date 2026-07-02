'use client'
import { useState, useEffect } from 'react'
import { Brain, Trash2, Shield, Zap, Database, RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface MemoryEntry {
  id: string
  memory_key: string
  memory_val: string
  source: string
  updated_at: string
}

export function SystemKnowledge({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchMemories = async () => {
    setIsSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/ai/memory', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        setMemories(data)
      }
    } catch (err) {
      toast.error('Failed to synchronize core cognition.')
    } finally {
      setLoading(false)
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchMemories()
  }, [isOpen])

  const deleteMemory = async (key: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/ai/memory?key=${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      if (res.ok) {
        setMemories(prev => prev.filter(m => m.memory_key !== key))
        toast.success(`Fragment [${key}] purged from memory.`)
      }
    } catch (err) {
      toast.error('Purge sequence failed.')
    }
  }

  const formatKey = (key: string) => {
    return key.replace(/_/g, ' ').toUpperCase()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/95 "
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-muted border border-border  overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-sm">
                <Database className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="text-xl    text-primary-foreground">Selfup Cognition</h2>
                <p className="text-[10px] text-primary/60 font-mono">Selfup Memory Fragments</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={fetchMemories}
                disabled={isSyncing}
                className={`p-2 hover:bg-muted rounded-sm transition-colors ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`}
              >
                <RefreshCw size={18} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-sm text-muted-foreground">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[url('/scanlines.png')] bg-repeat">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin" />
                <p className="text-xs font-mono text-primary animate-pulse ">Synchronizing Fragments...</p>
              </div>
            ) : memories.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <Brain className="mx-auto text-muted-foreground" size={48} />
                <p className="text-muted-foreground font-mono text-sm">No memory fragments detected in current sector.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {memories.map((memory) => (
                  <motion.div 
                    layout
                    key={memory.id}
                    className="group relative p-4 bg-card border border-white/5 hover:border-border transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]  text-primary">
                            [{formatKey(memory.memory_key)}]
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary font-mono rounded-sm">
                            Source: {memory.source}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed pr-8">
                          {memory.memory_val}
                        </p>
                      </div>
                      <button 
                        onClick={() => deleteMemory(memory.memory_key)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-sm transition-all"
                        title="Purge Memory"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {/* Timestamp */}
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8px] font-mono text-muted-foreground">
                        Last Synchronized: {new Date(memory.updated_at).toLocaleString()}
                      </span>
                      <Shield size={10} className="text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-background/95 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-mono text-muted-foreground tracking-tighter">
                Selfup memory influences all future companion interactions.
              </span>
            </div>
            <div className="text-[10px] font-mono text-primary/40">
              Fragments: {memories.length}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
