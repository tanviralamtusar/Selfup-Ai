import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Utensils, Clock, AlertCircle } from 'lucide-react'
import type { DietPlanRow } from '@/types/fitness'

interface ActiveDietPlanModalProps {
  isOpen: boolean
  onClose: () => void
  plan: DietPlanRow | null
}

export function ActiveDietPlanModal({ isOpen, onClose, plan }: ActiveDietPlanModalProps) {
  if (!plan) return null

  const getMealIconColor = (type: string) => {
    switch(type) {
      case 'breakfast': return 'text-amber-400'
      case 'lunch': return 'text-emerald-400'
      case 'dinner': return 'text-primary'
      case 'snack': return 'text-purple-400'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/95 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[85vh] bg-background border border-border rounded-xl  z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-start justify-between bg-muted relative overflow-hidden">
              <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded bg-primary/10 text-primary border border-border">
                    <Utensils size={20} />
                  </div>
                  <h2 className="text-lg  text-foreground ">Active Diet Plan</h2>
                </div>
                <div className="flex gap-4 text-[10px]  text-muted-foreground mt-4">
                  <span>{plan.daily_calories} KCAL</span>
                  <span>{plan.protein_target_g}G PRO</span>
                  <span>{plan.carbs_target_g}G CARB</span>
                  <span>{plan.fat_target_g}G FAT</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground bg-muted rounded-lg border border-border hover:border-border transition-all relative z-10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-muted">
              {(!plan.meal_templates || plan.meal_templates.length === 0) ? (
                <div className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm  text-muted-foreground ">No meals defined in this plan.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Sort meals logically if possible, otherwise just map */}
                  {plan.meal_templates.map((meal) => (
                    <div key={meal.id} className="bg-background border border-border rounded-xl overflow-hidden group hover:border-border transition-colors">
                      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-sm   ${getMealIconColor(meal.meal_type)}`}>
                            {meal.meal_type}
                          </h3>
                          {meal.suggested_time && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-[10px] text-muted-foreground font-medium">
                              <Clock size={12} />
                              {meal.suggested_time}
                            </div>
                          )}
                        </div>
                        {meal.total_calories && (
                          <span className="text-xs  text-muted-foreground tabular-nums">{meal.total_calories} KCAL</span>
                        )}
                      </div>
                      
                      <div className="p-5">
                        {meal.notes && (
                          <p className="text-xs text-muted-foreground  mb-4 leading-relaxed bg-muted p-3 rounded-lg border border-border">
                            "{meal.notes}"
                          </p>
                        )}
                        
                        {(!meal.meal_template_foods || meal.meal_template_foods.length === 0) ? (
                          <p className="text-xs text-muted-foreground font-medium">No specific foods listed.</p>
                        ) : (
                          <div className="space-y-2">
                            {meal.meal_template_foods.map((food) => (
                              <div key={food.id} className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted border border-transparent hover:border-border transition-colors">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground capitalize">{food.food_name}</p>
                                  {food.quantity && <p className="text-[10px] text-muted-foreground mt-1">{food.quantity}</p>}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  <span className="text-[11px]  text-muted-foreground">{food.calories} KCAL</span>
                                  <div className="flex gap-2 text-[9px] font-medium text-muted-foreground mt-1">
                                    <span>{food.protein_g}P</span>
                                    <span>{food.carbs_g}C</span>
                                    <span>{food.fat_g}F</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
