import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Minus, Trash2, Tag, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// @ts-ignore
import { Habit } from '@/lib/hooks/useHabits'

const habitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  is_positive: z.boolean(),
  is_negative: z.boolean(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']),
  category: z.string().optional(),
  reset_type: z.enum(['daily', 'weekly', 'monthly']),
})

type HabitFormValues = z.infer<typeof habitSchema>

interface HabitModalProps {
  isOpen: boolean
  onClose: () => void
  habit?: Habit | null
  onSave: (data: any) => Promise<any>
  onDelete?: (id: string) => Promise<any>
}

export function HabitModal({ isOpen, onClose, habit, onSave, onDelete }: HabitModalProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: '',
      description: '',
      is_positive: true,
      is_negative: false,
      difficulty: 'medium',
      category: 'general',
      reset_type: 'daily',
    }
  })

  const isPositive = watch('is_positive')
  const isNegative = watch('is_negative')

  useEffect(() => {
    if (isOpen) {
      setAdvancedOpen(false)
      if (habit) {
        reset({
          title: habit.title,
          description: habit.description || '',
          is_positive: habit.is_positive ?? true,
          is_negative: habit.is_negative ?? false,
          difficulty: habit.difficulty || 'medium',
          category: habit.category || 'general',
          reset_type: habit.reset_type || 'daily',
        })
      } else {
        reset({
          title: '',
          description: '',
          is_positive: true,
          is_negative: false,
          difficulty: 'medium',
          category: 'general',
          reset_type: 'daily',
        })
      }
    }
  }, [isOpen, habit, reset])

  const onSubmit = async (data: HabitFormValues) => {
    // Ensure at least one type is selected, default to positive if both false
    if (!data.is_positive && !data.is_negative) {
      data.is_positive = true
    }
    await onSave(data)
    onClose()
  }

  const togglePositive = () => setValue('is_positive', !isPositive, { shouldDirty: true })
  const toggleNegative = () => setValue('is_negative', !isNegative, { shouldDirty: true })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-950 border border-violet-500/30 rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.15)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header (Light Blue theme mapped to Violet for SelfUp) */}
              <div className="bg-gradient-to-b from-violet-900/40 to-slate-900/50 p-5 border-b border-violet-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black uppercase tracking-widest text-violet-50 flex items-center gap-2 system-text-glow italic">
                    {habit ? 'Edit Habit' : 'New Habit'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-violet-300 hover:bg-violet-500/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                      className="px-5 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-300/80 pl-1">Title *</label>
                    <span className="text-[10px] text-violet-300/50 flex items-center gap-1"><Info size={10} /> Avoid SPI</span>
                  </div>
                  <input
                    {...register('title')}
                    placeholder="E.g., No Fap"
                    className="w-full bg-slate-950/50 border border-violet-500/30 rounded-lg px-4 py-2.5 text-sm text-violet-50 placeholder:text-violet-300/30 focus:outline-none focus:border-violet-400 focus:bg-slate-900 transition-all font-medium"
                  />
                  {errors.title && <p className="text-[10px] text-rose-400 pl-1">{errors.title.message}</p>}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-300/80 pl-1">Notes</label>
                    <span className="text-[10px] text-violet-300/50">Markdown formatting help</span>
                  </div>
                  <textarea
                    {...register('description')}
                    placeholder="Add notes"
                    rows={3}
                    className="w-full bg-slate-950/50 border border-violet-500/30 rounded-lg px-4 py-2.5 text-sm text-violet-50 placeholder:text-violet-300/30 focus:outline-none focus:border-violet-400 focus:bg-slate-900 transition-all font-medium resize-none"
                  />
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-950">
                
                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 pl-1 flex items-center gap-1.5">
                    Difficulty <Info size={10} className="text-violet-400/40" />
                  </label>
                  <div className="relative">
                    <select
                      {...register('difficulty')}
                      className="w-full appearance-none bg-slate-900/50 border border-violet-500/20 rounded-lg px-4 py-3 text-sm font-bold text-violet-100 focus:outline-none focus:border-violet-500/50 focus:bg-slate-900 transition-all cursor-pointer"
                    >
                      <option value="trivial" className="bg-slate-900 text-violet-100">Trivial ✦</option>
                      <option value="easy" className="bg-slate-900 text-violet-100">Easy ✦✦</option>
                      <option value="medium" className="bg-slate-900 text-violet-100">Medium ✦✦✦</option>
                      <option value="hard" className="bg-slate-900 text-violet-100">Hard ✦✦✦✦</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={14} className="text-violet-500/50" />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 pl-1">Tags</label>
                  <div className="relative">
                    <select
                      {...register('category')}
                      className="w-full appearance-none bg-slate-900/50 border border-violet-500/20 rounded-lg px-4 py-3 text-sm font-bold text-violet-100 focus:outline-none focus:border-violet-500/50 focus:bg-slate-900 transition-all cursor-pointer"
                    >
                      <option value="general" className="bg-slate-900 text-violet-100">General</option>
                      <option value="fitness" className="bg-slate-900 text-violet-100">Fitness</option>
                      <option value="skills" className="bg-slate-900 text-violet-100">Skills</option>
                      <option value="style" className="bg-slate-900 text-violet-100">Style</option>
                      <option value="system" className="bg-slate-900 text-violet-100">System</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={14} className="text-violet-500/50" />
                    </div>
                  </div>
                </div>

                {/* Reset Counter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 pl-1">Reset Counter</label>
                  <div className="relative">
                    <select
                      {...register('reset_type')}
                      className="w-full appearance-none bg-slate-900/50 border border-violet-500/20 rounded-lg px-4 py-3 text-sm font-bold text-violet-100 focus:outline-none focus:border-violet-500/50 focus:bg-slate-900 transition-all cursor-pointer"
                    >
                      <option value="daily" className="bg-slate-900 text-violet-100">Daily</option>
                      <option value="weekly" className="bg-slate-900 text-violet-100">Weekly</option>
                      <option value="monthly" className="bg-slate-900 text-violet-100">Monthly</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={14} className="text-violet-500/50" />
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="border-t border-violet-500/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    Advanced Settings
                    {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <AnimatePresence>
                    {advancedOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-4"
                      >
                        <p className="text-xs text-slate-500 text-center italic">No advanced settings available.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Delete Button */}
                {habit && onDelete && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => onDelete(habit.id)}
                      className="flex items-center gap-2 text-xs font-black tracking-widest text-rose-500 hover:text-rose-400 px-4 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={16} /> Delete this Habit
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
