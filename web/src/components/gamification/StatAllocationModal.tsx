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
            className="absolute inset-0 bg-background/80"
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
                className="absolute top-0 right-0 p-2 rounded-full hover:bg-primary/10 text-primary transition-colors z-50"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex flex-col items-center justify-center gap-1 mb-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400/50 flex items-center justify-center bg-amber-500/10">
                    <span className="text-2xl  text-amber-300">+{statPoints}</span>
                  </div>
                  <p className="text-[10px]  text-amber-400 ">Points Available</p>
                </div>
                
                <h2 className="text-xl  text-foreground ">
                  Enhance Your Vessel
                </h2>
                <p className="text-xs text-foreground/80/60 mt-2 font-medium">
                  Allocate stat points to permanently increase your base attributes.
                </p>
              </div>

              <div className="space-y-3">
                {ATTRIBUTES.map((attr) => {
                  const currentValue = attributes[attr.key] || 0
                  const isMaxed = currentValue >= 50
                  
                  return (
                    <div key={attr.key} className={cn("p-3 rounded-xl border flex items-center gap-4 bg-muted transition-all", isMaxed ? "border-border opacity-60" : "border-border hover:border-border")}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn("text-sm ", attr.color)}>
                            {attr.name}
                          </h3>
                          <span className="px-1.5 py-0.5 rounded bg-background text-foreground text-[10px] font-medium border border-border tabular-nums">
                            {currentValue} / 50
                          </span>
                        </div>
                        <p className="text-[10px] text-foreground/80/60 leading-snug">
                          {attr.domain} &bull; <span className="text-primary/80/80">{attr.primaryBonus}</span>
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleAllocate(attr.key)}
                        disabled={isMaxed || statPoints <= 0 || allocating === attr.key}
                        className={cn(
                          "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border transition-all",
                          isMaxed 
                            ? "bg-background border-border text-muted-foreground cursor-not-allowed" 
                            : allocating === attr.key
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse"
                              : "bg-primary/10 border-border text-primary hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-400 active:scale-90 "
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
