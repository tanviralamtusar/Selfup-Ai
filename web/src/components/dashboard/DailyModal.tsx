import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Trash2, Calendar, Repeat, Tag, Loader2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

// @ts-ignore
import { Daily } from '@/lib/hooks/useDailies'

const dailySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().optional(),
  repeat_type: z.enum(['daily', 'weekly']),
  repeat_days: z.array(z.string()).optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    is_completed: z.boolean()
  })).optional()
})

type DailyFormValues = z.infer<typeof dailySchema>

interface DailyModalProps {
  isOpen: boolean
  onClose: () => void
  daily?: Daily | null
  onSave: (data: any) => Promise<any>
  onDelete?: (id: string) => Promise<any>
}

const DAYS = [
  { id: 'sun', label: 'Su' },
  { id: 'mon', label: 'Mo' },
  { id: 'tue', label: 'Tu' },
  { id: 'wed', label: 'We' },
  { id: 'thu', label: 'Th' },
  { id: 'fri', label: 'Fr' },
  { id: 'sat', label: 'Sa' },
]

export function DailyModal({ isOpen, onClose, daily, onSave, onDelete }: DailyModalProps) {
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<DailyFormValues>({
    resolver: zodResolver(dailySchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
      repeat_type: 'daily',
      repeat_days: [],
      subtasks: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subtasks"
  })

  const repeatType = watch('repeat_type')
  const repeatDays = watch('repeat_days') || []

  useEffect(() => {
    if (isOpen) {
      if (daily) {
        reset({
          title: daily.title,
          description: daily.description || '',
          priority: daily.priority,
          category: daily.category || 'general',
          repeat_type: daily.repeat_type,
          repeat_days: daily.repeat_days || [],
          subtasks: daily.subtasks || []
        })
      } else {
        reset({
          title: '',
          description: '',
          priority: 'medium',
          category: 'general',
          repeat_type: 'daily',
          repeat_days: [],
          subtasks: []
        })
      }
    }
  }, [isOpen, daily, reset])

  const onSubmit = async (data: DailyFormValues) => {
    // If weekly is selected but no days, default to every day (or error? schema allows empty, but API might not)
    if (data.repeat_type === 'weekly' && (!data.repeat_days || data.repeat_days.length === 0)) {
      data.repeat_days = DAYS.map(d => d.id)
    }
    await onSave(data)
    onClose()
  }

  const toggleDay = (dayId: string) => {
    if (repeatDays.includes(dayId)) {
      setValue('repeat_days', repeatDays.filter(d => d !== dayId), { shouldDirty: true })
    } else {
      setValue('repeat_days', [...repeatDays, dayId], { shouldDirty: true })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95  z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border rounded-xl  w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
                <h2 className="text-sm  text-foreground flex items-center gap-2 ">
                  {daily ? 'Edit Daily' : 'New Daily'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px]  text-primary/60 pl-1">Title *</label>
                  <input
                    {...register('title')}
                    placeholder="E.g., Morning Workout"
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:bg-muted transition-all font-medium"
                  />
                  {errors.title && <p className="text-[10px] text-rose-400 pl-1">{errors.title.message}</p>}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px]  text-primary/60 pl-1">Notes</label>
                  <textarea
                    {...register('description')}
                    placeholder="Add details, links, or instructions..."
                    rows={3}
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:bg-muted transition-all font-medium resize-none"
                  />
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <label className="text-[10px]  text-primary/60 pl-1">Checklist</label>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2 bg-muted rounded-lg border border-border p-1 pl-2">
                        <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                        <input
                          {...register(`subtasks.${index}.title` as const)}
                          placeholder="Subtask item..."
                          className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none placeholder:text-muted-foreground font-medium py-1"
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => append({ title: '', is_completed: false })}
                      className="text-[10px]  text-primary hover:text-primary/80 flex items-center gap-1.5 px-2 py-1 transition-colors"
                    >
                      <Plus size={12} /> Add Item
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Difficulty */}
                  <div className="space-y-1.5">
                    <label className="text-[10px]  text-primary/60 pl-1">Difficulty</label>
                    <div className="relative">
                      <select
                        {...register('priority')}
                        className="w-full appearance-none bg-muted border border-border rounded-lg px-4 py-2.5 text-sm  text-foreground focus:outline-none focus:border-border focus:bg-muted transition-all cursor-pointer"
                      >
                        <option value="low" className="bg-muted text-foreground">Low (Trivial)</option>
                        <option value="medium" className="bg-muted text-foreground">Medium (Standard)</option>
                        <option value="high" className="bg-muted text-foreground">High (Hard)</option>
                        <option value="critical" className="bg-muted text-rose-400">Critical (Boss)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Tag size={14} className="text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Tags / Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px]  text-primary/60 pl-1">Category</label>
                    <select
                      {...register('category')}
                      className="w-full appearance-none bg-muted border border-border rounded-lg px-4 py-2.5 text-sm  text-foreground focus:outline-none focus:border-border focus:bg-muted transition-all cursor-pointer"
                    >
                      <option value="general" className="bg-muted text-foreground">General</option>
                      <option value="fitness" className="bg-muted text-foreground">Fitness</option>
                      <option value="skills" className="bg-muted text-foreground">Skills</option>
                      <option value="style" className="bg-muted text-foreground">Style</option>
                    </select>
                  </div>
                </div>

                {/* Repeats */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <label className="text-[10px]  text-primary/60 pl-1 flex items-center gap-1.5">
                      <Repeat size={12} /> Repeats
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setValue('repeat_type', 'daily')}
                        className={cn(
                          "flex-1 py-2 text-[10px]  rounded-lg transition-all border",
                          repeatType === 'daily'
                            ? "bg-primary/15 text-primary/80 border-border "
                            : "bg-muted text-foreground/40 border-border hover:border-border"
                        )}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue('repeat_type', 'weekly')}
                        className={cn(
                          "flex-1 py-2 text-[10px]  rounded-lg transition-all border",
                          repeatType === 'weekly'
                            ? "bg-primary/15 text-primary/80 border-border "
                            : "bg-muted text-foreground/40 border-border hover:border-border"
                        )}
                      >
                        Weekly
                      </button>
                    </div>
                  </div>

                  {/* Repeat Days (If Weekly) */}
                  <AnimatePresence>
                    {repeatType === 'weekly' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="text-[10px]  text-primary/60 pl-1">Repeat On</label>
                        <div className="flex gap-1 justify-between">
                          {DAYS.map(day => {
                            const isActive = repeatDays.includes(day.id);
                            return (
                              <button
                                key={day.id}
                                type="button"
                                onClick={() => toggleDay(day.id)}
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center text-[10px]  transition-all border",
                                  isActive
                                    ? "bg-primary border-primary/30 text-white "
                                    : "bg-muted border-border text-primary/40 hover:border-border hover:text-primary"
                                )}
                              >
                                {day.label}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-muted flex items-center justify-between">
                {daily && onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(daily.id)}
                    className="flex items-center gap-1.5 text-[10px]  text-rose-500 hover:text-rose-400 px-3 py-2 rounded border border-transparent hover:border-destructive/20 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-lg text-xs  text-primary hover:bg-primary/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs   transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Daily'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
