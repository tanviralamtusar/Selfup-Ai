'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Camera, Check, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutfitLog {
  id: string
  log_date: string
  description: string
  rating: number
  tags: string[]
  notes: string
}

export function OutfitLogCard({ logs, onAdd }: { logs: OutfitLog[], onAdd: (v: any) => Promise<void> }) {
  const [isAdding, setIsAdding] = useState(false)
  const [desc, setDesc] = useState('')
  const [tags, setTags] = useState('')
  const [rating, setRating] = useState(3)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!desc.trim()) return
    setLoading(true)
    await onAdd({
      description: desc,
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
      rating,
      notes: ''
    })
    setLoading(false)
    setIsAdding(false)
    setDesc('')
    setTags('')
    setRating(3)
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-black text-on-surface">Outfit Log</h3>
          <p className="text-xs text-on-surface-variant/60">Track your daily fits</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 flex items-center justify-center transition-all"
        >
          {isAdding ? <Check size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="What are you wearing today?"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
          />
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tags (comma separated)..."
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="flex-1 bg-surface-container border border-outline-variant/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
            />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    rating >= r ? "text-amber-400" : "text-on-surface-variant/20 hover:text-amber-400/50"
                  )}
                >
                  <Star size={18} fill={rating >= r ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !desc.trim()}
            className="w-full py-3 rounded-xl bg-pink-500 text-white font-black text-xs uppercase tracking-widest hover:bg-pink-400 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            Log Outfit
          </button>
        </motion.div>
      )}

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-center py-6 text-on-surface-variant/40">No outfits logged yet.</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="p-4 rounded-2xl bg-surface-container border border-outline-variant/5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-bold text-on-surface">{log.description}</p>
                <div className="flex gap-0.5">
                  {[...Array(log.rating)].map((_, i) => <Star key={i} size={12} className="text-amber-400" fill="currentColor" />)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {log.tags.map(t => (
                  <span key={t} className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-pink-500/10 text-pink-400 rounded-md">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant/40">
                {new Date(log.log_date).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
