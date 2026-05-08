'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SystemFrame } from '../ui/SystemFrame'
import { ATTRIBUTES, type AttributeKey } from '@/constants/gamification'
import { cn } from '@/lib/utils'

interface StatAllocationModalProps {
  isOpen: boolean
  onClose: () => void
  statPoints: number
  attributes: Record<AttributeKey, number>
  onAllocate: (attribute: AttributeKey) => Promise<boolean>
}

export function StatAllocationModal({ isOpen, onClose, statPoints, attributes, onAllocate }: StatAllocationModalProps) {
  const [allocating, setAllocating] = useState<AttributeKey | null>(null)

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  const handleAllocate = async (attrKey: AttributeKey) => {
    if (statPoints <= 0 || allocating) return
    setAllocating(attrKey)
    const success = await onAllocate(attrKey)
    setAllocating(null)
    if (success && statPoints <= 1) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-visible"
          >
            <SystemFrame title="Attribute Allocation" className="w-full">
              <button
                onClick={onClose}
                className="absolute top-0 right-0 p-2 rounded-full hover:bg-blue-500/10 text-blue-400 transition-colors z-50"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex flex-col items-center justify-center gap-1 mb-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400/50 flex items-center justify-center bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <span className="text-2xl font-black text-amber-300">+{statPoints}</span>
                  </div>
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Points Available</p>
                </div>
                
                <h2 className="text-xl font-black text-blue-50 uppercase tracking-[0.1em] system-text-glow">
                  Enhance Your Vessel
                </h2>
                <p className="text-xs text-blue-200/60 mt-2 font-medium">
                  Allocate stat points to permanently increase your base attributes.
                </p>
              </div>

              <div className="space-y-3">
                {ATTRIBUTES.map((attr) => {
                  const currentValue = attributes[attr.key] || 0
                  const isMaxed = currentValue >= 50
                  
                  return (
                    <div key={attr.key} className={cn("p-3 rounded-xl border flex items-center gap-4 bg-slate-900/50 transition-all", isMaxed ? "border-blue-500/10 opacity-60" : "border-blue-500/20 hover:border-blue-400/40")}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn("text-sm font-black uppercase tracking-wider", attr.color)}>
                            {attr.name}
                          </h3>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-blue-100 text-[10px] font-bold border border-blue-500/20 tabular-nums">
                            {currentValue} / 50
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-200/60 leading-snug">
                          {attr.domain} &bull; <span className="text-blue-300/80">{attr.primaryBonus}</span>
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleAllocate(attr.key)}
                        disabled={isMaxed || statPoints <= 0 || allocating === attr.key}
                        className={cn(
                          "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border transition-all",
                          isMaxed 
                            ? "bg-slate-950 border-blue-500/10 text-blue-500/30 cursor-not-allowed" 
                            : allocating === attr.key
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse"
                              : "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-400 active:scale-90 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                        )}
                      >
                        {isMaxed ? <ShieldAlert size={16} /> : <Plus size={18} strokeWidth={3} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </SystemFrame>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
