import React, { useState, useEffect } from 'react'
import { Droplet, Utensils, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ActiveDietPlanModal } from './ActiveDietPlanModal'
import type { DietPlanRow } from '@/types/fitness'

export default function NutritionView() {
  const [foods, setFoods] = useState<any[]>([])
  const [waterAmount, setWaterAmount] = useState(0)
  const [dietPlan, setDietPlan] = useState<DietPlanRow | null>(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ meal_type: 'snack', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hardcoded goals as fallback, overridden by active diet plan if it exists
  const goals = { 
    calories: dietPlan?.daily_calories ?? 2500, 
    protein_g: dietPlan?.protein_target_g ?? 180, 
    carbs_g: dietPlan?.carbs_target_g ?? 250, 
    fat_g: dietPlan?.fat_target_g ?? 80, 
    water_ml: 3000 
  }

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = { 'Authorization': `Bearer ${session?.access_token}` }
      const [foodRes, waterRes, planRes] = await Promise.all([
        fetch('/api/fitness/nutrition', { headers }),
        fetch('/api/fitness/water', { headers }),
        fetch('/api/fitness/diet/plan?active_only=true', { headers })
      ])
      const [foodData, waterData, planData] = await Promise.all([
        foodRes.json(), 
        waterRes.json(),
        planRes.json()
      ])
      
      setFoods(Array.isArray(foodData) ? foodData : [])
      
      const totalWater = Array.isArray(waterData) 
        ? waterData.reduce((acc, curr) => acc + curr.amount_ml, 0)
        : 0
      setWaterAmount(totalWater)
      
      if (planData.success && planData.data && planData.data.length > 0) {
        setDietPlan(planData.data[0])
      }
    } catch (err) {
      toast.error('Failed to load nutrition data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogFood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.food_name) return

    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/fitness/nutrition', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          meal_type: form.meal_type,
          food_name: form.food_name,
          calories: parseInt(form.calories) || 0,
          protein_g: parseFloat(form.protein_g) || 0,
          carbs_g: parseFloat(form.carbs_g) || 0,
          fat_g: parseFloat(form.fat_g) || 0
        })
      })

      if (res.ok) {
        toast.success(`Logged ${form.food_name}`)
        setForm({ meal_type: 'snack', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
        fetchData()
      } else {
        toast.error('Failed to log food')
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddWater = async (amount: number) => {
    try {
      // Optimistic update
      setWaterAmount(prev => prev + amount)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/fitness/water', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ amount_ml: amount })
      })

      if (res.ok) {
        toast.success(`+${amount}ml Water`)
      } else {
        setWaterAmount(prev => prev - amount)
        toast.error('Failed to log water')
      }
    } catch (err) {
      setWaterAmount(prev => prev - amount)
      toast.error('Something went wrong')
    }
  }

  const currentMacros = foods.reduce((acc, curr) => {
    return {
      calories: acc.calories + (curr.calories || 0),
      protein: acc.protein + (curr.protein_g || 0),
      carbs: acc.carbs + (curr.carbs_g || 0),
      fat: acc.fat + (curr.fat_g || 0)
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const MacroBar = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
    const pct = Math.min((current / target) * 100, 100)
    return (
      <div className="group">
        <div className="flex justify-between text-[10px] mb-2">
          <span className="text-muted-foreground   group-hover:text-primary transition-colors">{label}</span>
          <span className=" text-foreground group-hover:transition-all">{Math.round(current)} / {target}G</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className={`h-full rounded-full transition-all duration-1000 ${color}`}
          />
        </div>
      </div>
    )
  }

  if (loading) return <div className="h-64 rounded-xl bg-card animate-pulse border border-border " />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 ">
      {/* ─── Macro & Water Tracking ─── */}
      <div className="space-y-10">
        <section className="bg-background border border-border rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded bg-primary/10 text-primary border border-border">
                <Utensils size={20} />
              </div>
              <h2 className="text-[10px]   text-muted-foreground">Daily Calories</h2>
            </div>
            <div className="flex items-center gap-6">
              {dietPlan && (
                <button 
                  onClick={() => setIsPlanModalOpen(true)}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/15 border border-border text-[10px] text-primary  rounded-lg transition-colors"
                >
                  View Plan
                </button>
              )}
              <div className="text-right">
                <span className="text-3xl  text-foreground tracking-tighter">{Math.round(currentMacros.calories)}</span>
                <span className="text-[10px] text-muted-foreground  ml-2">/ {goals.calories} KCAL</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            <MacroBar label="Protein" current={currentMacros.protein} target={goals.protein_g} color="bg-rose-500" />
            <MacroBar label="Carbs" current={currentMacros.carbs} target={goals.carbs_g} color="bg-[#5db8a0]" />
            <MacroBar label="Fat" current={currentMacros.fat} target={goals.fat_g} color="bg-amber-500" />
          </div>
        </section>

        <section className="bg-background border border-border rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded bg-primary/10 text-primary border border-border">
                <Droplet size={20} />
              </div>
              <h2 className="text-[10px]   text-muted-foreground">Water Intake</h2>
            </div>
            <div className="text-right">
              <span className="text-3xl  text-primary tracking-tighter">{waterAmount}</span>
              <span className="text-[10px] text-muted-foreground  ml-2">/ {goals.water_ml} ML</span>
            </div>
          </div>
          
          <div className="flex gap-4 relative z-10">
            {[250, 500, 1000].map(amount => (
              <button
                key={amount}
                onClick={() => handleAddWater(amount)}
                className="flex-1 py-4 bg-muted hover:bg-primary border border-border hover:border-primary/30 rounded-lg  text-muted-foreground hover:text-white transition-all text-[11px] shadow-inner group/btn"
              >
                <span className="group-hover/btn:animate-pulse">+{amount}ML</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ─── Add Meal Form ─── */}
      <section className="bg-background border border-border rounded-xl p-8 relative overflow-hidden group">
        <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="p-2 rounded bg-primary/10 text-primary border border-border">
            <Plus size={20} />
          </div>
          <h2 className="text-[10px]   text-muted-foreground">Log Food</h2>
        </div>
        
        <form onSubmit={handleLogFood} className="space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px]   text-muted-foreground mb-2">Food Name</label>
              <input
                required
                type="text"
                value={form.food_name}
                onChange={e => setForm({...form, food_name: e.target.value})}
                placeholder="E.G. CHICKEN BREAST"
                className="w-full bg-background border border-border rounded-lg px-4 py-3.5 text-xs font-medium text-foreground focus:outline-none focus:border-border transition-colors placeholder:text-muted-foreground"
              />
            </div>
            
            <div>
              <label className="block text-[10px]   text-muted-foreground mb-2">Meal Type</label>
              <select
                value={form.meal_type}
                onChange={e => setForm({...form, meal_type: e.target.value})}
                className="w-full bg-background border border-border rounded-lg px-4 py-3.5 text-xs font-medium text-foreground focus:outline-none focus:border-border"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px]   text-muted-foreground mb-2">Calories</label>
              <input
                type="number"
                value={form.calories}
                onChange={e => setForm({...form, calories: e.target.value})}
                className="w-full bg-background border border-border rounded-lg px-4 py-3.5 text-xs font-medium text-foreground focus:outline-none focus:border-border"
              />
            </div>

            <div className="group/input">
              <label className="block text-[10px]   text-rose-500/30 mb-2 group-focus-within/input:text-rose-400 transition-colors">Protein</label>
              <input
                type="number"
                value={form.protein_g}
                onChange={e => setForm({...form, protein_g: e.target.value})}
                className="w-full bg-background border border-destructive/20 rounded-lg px-4 py-3.5 text-xs font-medium text-rose-50 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="group/input">
              <label className="block text-[10px]   text-[#5db8a0]/30 mb-2 group-focus-within/input:text-[#5db8a0] transition-colors">Carbs</label>
              <input
                type="number"
                value={form.carbs_g}
                onChange={e => setForm({...form, carbs_g: e.target.value})}
                className="w-full bg-background border border-border rounded-lg px-4 py-3.5 text-xs font-medium text-foreground focus:outline-none focus:border-border"
              />
            </div>

            <div className="group/input">
              <label className="block text-[10px]   text-amber-500/30 mb-2 group-focus-within/input:text-amber-400 transition-colors">Fat</label>
              <input
                type="number"
                value={form.fat_g}
                onChange={e => setForm({...form, fat_g: e.target.value})}
                className="w-full bg-background border border-amber-500/10 rounded-lg px-4 py-3.5 text-xs font-medium text-amber-50 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full mt-6 flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary text-white   rounded-lg transition-all  border border-primary/30 group active:scale-95"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />}
            Log Food
          </button>
        </form>
      </section>

      <ActiveDietPlanModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
        plan={dietPlan} 
      />
    </div>
  )
}
