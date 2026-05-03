'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Trash2, Calendar, Tag, Loader2, GripVertical, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo } from '@/lib/hooks/useTodos'

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().optional(),
  due_date: z.string().optional().nullable(),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    is_completed: z.boolean()
  })).optional()
})

type TodoFormValues = z.infer<typeof todoSchema>

interface TodoModalProps {
  isOpen: boolean
  onClose: () => void
  todo?: Todo | null
  onSave: (data: any) => Promise<any>
  onDelete?: (id: string) => Promise<any>
}

export function TodoModal({ isOpen, onClose, todo, onSave, onDelete }: TodoModalProps) {
  const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting } } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
      due_date: '',
      subtasks: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subtasks"
  })

  useEffect(() => {
    if (isOpen) {
      if (todo) {
        reset({
          title: todo.title,
          description: todo.description || '',
          priority: todo.priority,
          category: todo.category || 'general',
          due_date: todo.due_date ? todo.due_date.split('T')[0] : '',
          subtasks: todo.subtasks || []
        })
      } else {
        reset({
          title: '',
          description: '',
          priority: 'medium',
          category: 'general',
          due_date: '',
          subtasks: []
        })
      }
    }
  }, [isOpen, todo, reset])

  const onSubmit = async (data: TodoFormValues) => {
    await onSave(data)
    onClose()
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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-950 border border-rose-500/30 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.15)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-rose-500/10 bg-slate-900/50">
                <h2 className="text-sm font-black uppercase tracking-widest text-rose-50 flex items-center gap-2 system-text-glow italic">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  {todo ? 'Edit Task' : 'New Task'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-rose-500/50 hover:text-rose-400 transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 pl-1">Title *</label>
                  <input
                    {...register('title')}
                    placeholder="E.g., Complete System Integration"
                    className="w-full bg-slate-900/50 border border-rose-500/20 rounded-lg px-4 py-2.5 text-sm text-blue-50 placeholder:text-rose-500/30 focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all font-medium"
                  />
                  {errors.title && <p className="text-[10px] text-rose-400 pl-1">{errors.title.message}</p>}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 pl-1">Notes</label>
                  <textarea
                    {...register('description')}
                    placeholder="Add details or instructions..."
                    rows={3}
                    className="w-full bg-slate-900/50 border border-rose-500/20 rounded-lg px-4 py-2.5 text-sm text-blue-50 placeholder:text-rose-500/30 focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all font-medium resize-none"
                  />
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 pl-1">Checklist</label>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2 bg-slate-900/30 rounded-lg border border-rose-500/10 p-1 pl-2">
                        <GripVertical size={14} className="text-rose-500/30 cursor-grab" />
                        <input
                          {...register(`subtasks.${index}.title` as const)}
                          placeholder="Subtask item..."
                          className="flex-1 bg-transparent border-none text-xs text-blue-50 focus:outline-none placeholder:text-rose-500/30 font-medium py-1"
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
                      className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-2 py-1 transition-colors"
                    >
                      <Plus size={12} /> Add Item
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Difficulty/Priority */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 pl-1">Priority</label>
                    <div className="relative">
                      <select
                        {...register('priority')}
                        className="w-full appearance-none bg-slate-900/50 border border-rose-500/20 rounded-lg px-4 py-2.5 text-sm font-black text-blue-100 uppercase tracking-wider focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all cursor-pointer"
                      >
                        <option value="low" className="bg-slate-900 text-blue-100">Low (Trivial)</option>
                        <option value="medium" className="bg-slate-900 text-blue-100">Medium (Standard)</option>
                        <option value="high" className="bg-slate-900 text-blue-100">High (Hard)</option>
                        <option value="critical" className="bg-slate-900 text-rose-400">Critical (Boss)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Tag size={14} className="text-rose-500/50" />
                      </div>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 pl-1">Due Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        {...register('due_date')}
                        className="w-full bg-slate-900/50 border border-rose-500/20 rounded-lg px-4 py-2.5 text-sm font-black text-blue-100 uppercase tracking-wider focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all cursor-pointer"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Calendar size={14} className="text-rose-500/50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 pl-1">Category</label>
                  <select
                    {...register('category')}
                    className="w-full appearance-none bg-slate-900/50 border border-rose-500/20 rounded-lg px-4 py-2.5 text-sm font-black text-blue-100 uppercase tracking-wider focus:outline-none focus:border-rose-500/50 focus:bg-slate-900 transition-all cursor-pointer"
                  >
                    <option value="general" className="bg-slate-900 text-blue-100">General</option>
                    <option value="fitness" className="bg-slate-900 text-blue-100">Fitness</option>
                    <option value="skills" className="bg-slate-900 text-blue-100">Skills</option>
                    <option value="style" className="bg-slate-900 text-blue-100">Style</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-rose-500/10 bg-slate-900/50 flex items-center justify-between">
                {todo && onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(todo.id)}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 px-3 py-2 rounded border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Task'}
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
