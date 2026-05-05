'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Droplet, Flame, Coffee } from 'lucide-react';
import type { DietPlanRow, MealTemplateRow, MealTemplateFoodRow } from '@/types/fitness';

interface DietPlanViewProps {
  dietPlan: DietPlanRow & { 
    meal_templates: (MealTemplateRow & { meal_template_foods: MealTemplateFoodRow[] })[] 
  };
}

export function DietPlanView({ dietPlan }: DietPlanViewProps) {
  if (!dietPlan) return null;

  const { daily_targets } = dietPlan;
  const targets = typeof daily_targets === 'string' ? JSON.parse(daily_targets) : daily_targets;

  return (
    <div className="space-y-6">
      {/* Header / Macros */}
      <div className="bg-dark-surface/50 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Apple className="text-green-400" /> Daily Targets
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
            <Flame className="text-orange-400 mb-2" size={24} />
            <span className="text-2xl font-bold text-white">{targets.calories || 2000}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Calories</span>
          </div>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-primary-400 mb-2 font-bold">P</span>
            <span className="text-2xl font-bold text-white">{targets.protein_g || 150}g</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Protein</span>
          </div>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-yellow-400 mb-2 font-bold">C</span>
            <span className="text-2xl font-bold text-white">{targets.carbs_g || 200}g</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Carbs</span>
          </div>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-blue-400 mb-2 font-bold">F</span>
            <span className="text-2xl font-bold text-white">{targets.fats_g || 65}g</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Fats</span>
          </div>
        </div>
      </div>

      {/* Meal Templates */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Suggested Meals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dietPlan.meal_templates?.map((meal, idx) => (
            <motion.div 
              key={meal.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-dark-surface border border-white/10 rounded-xl p-5"
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-white text-lg capitalize">{meal.meal_type}</h4>
                <div className="text-right">
                  <span className="text-sm font-bold text-orange-400">{meal.target_calories} kcal</span>
                </div>
              </div>
              
              <ul className="space-y-3">
                {meal.meal_template_foods?.map((food, fIdx) => (
                  <li key={fIdx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-300">{food.amount} {food.unit} {food.food_name}</span>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>P:{food.protein_g}</span>
                      <span>C:{food.carbs_g}</span>
                      <span>F:{food.fats_g}</span>
                    </div>
                  </li>
                ))}
              </ul>
              
              {meal.notes && (
                <p className="mt-4 text-xs text-gray-400 bg-black/20 p-2 rounded">
                  💡 {meal.notes}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
