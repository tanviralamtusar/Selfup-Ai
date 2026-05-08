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
          <span className="text-blue-500/40 font-black uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">{label}</span>
          <span className="font-black text-blue-50 tracking-wider group-hover:system-text-glow transition-all">{Math.round(current)} / {target}G</span>
        </div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-blue-500/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className={`h-full rounded-full transition-all duration-1000 ${color} shadow-[0_0_10px_currentColor]`}
          />
        </div>
      </div>
    )
  }

  if (loading) return <div className="h-64 rounded-xl bg-slate-950/40 animate-pulse border border-blue-500/10 shadow-[inset_0_0_30px_rgba(59,130,246,0.05)]" />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 italic">
      {/* ─── Macro & Water Tracking ─── */}
      <div className="space-y-10">
        <section className="bg-slate-950 border border-blue-500/20 rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Utensils size={20} />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">Daily Calories</h2>
            </div>
            <div className="flex items-center gap-6">
              {dietPlan && (
                <button 
                  onClick={() => setIsPlanModalOpen(true)}
                  className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-400 font-black uppercase tracking-widest rounded-lg transition-colors"
                >
                  View Plan
                </button>
              )}
              <div className="text-right">
                <span className="text-3xl font-black text-blue-50 system-text-glow tracking-tighter">{Math.round(currentMacros.calories)}</span>
                <span className="text-[10px] text-blue-500/30 uppercase font-black tracking-widest ml-2">/ {goals.calories} KCAL</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            <MacroBar label="Protein" current={currentMacros.protein} target={goals.protein_g} color="bg-rose-500" />
            <MacroBar label="Carbs" current={currentMacros.carbs} target={goals.carbs_g} color="bg-cyan-400" />
            <MacroBar label="Fat" current={currentMacros.fat} target={goals.fat_g} color="bg-amber-500" />
          </div>
        </section>

        <section className="bg-slate-950 border border-blue-500/20 rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Droplet size={20} />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">Water Intake</h2>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-blue-400 system-text-glow tracking-tighter">{waterAmount}</span>
              <span className="text-[10px] text-blue-500/30 uppercase font-black tracking-widest ml-2">/ {goals.water_ml} ML</span>
            </div>
          </div>
          
          <div className="flex gap-4 relative z-10">
            {[250, 500, 1000].map(amount => (
              <button
                key={amount}
                onClick={() => handleAddWater(amount)}
                className="flex-1 py-4 bg-blue-900/5 hover:bg-blue-600 border border-blue-500/10 hover:border-blue-400 rounded-lg font-black text-blue-500/60 hover:text-white transition-all text-[11px] uppercase tracking-widest shadow-inner group/btn"
              >
                <span className="group-hover/btn:animate-pulse">+{amount}ML</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ─── Add Meal Form ─── */}
      <section className="bg-slate-950 border border-blue-500/20 rounded-xl p-8 relative overflow-hidden group">
        <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Plus size={20} />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">Log Food</h2>
        </div>
        
        <form onSubmit={handleLogFood} className="space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/30 mb-2">Food Name</label>
              <input
                required
                type="text"
                value={form.food_name}
                onChange={e => setForm({...form, food_name: e.target.value})}
                placeholder="E.G. CHICKEN BREAST"
                className="w-full bg-slate-950 border border-blue-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-blue-50 focus:outline-none focus:border-blue-500/50 transition-colors uppercase tracking-widest placeholder:text-blue-500/10"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/30 mb-2">Meal Type</label>
              <select
                value={form.meal_type}
                onChange={e => setForm({...form, meal_type: e.target.value})}
                className="w-full bg-slate-950 border border-blue-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-blue-50 focus:outline-none focus:border-blue-500/50 uppercase tracking-widest"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/30 mb-2">Calories</label>
              <input
                type="number"
                value={form.calories}
                onChange={e => setForm({...form, calories: e.target.value})}
                className="w-full bg-slate-950 border border-blue-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-blue-50 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="group/input">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/30 mb-2 group-focus-within/input:text-rose-400 transition-colors">Protein</label>
              <input
                type="number"
                value={form.protein_g}
                onChange={e => setForm({...form, protein_g: e.target.value})}
                className="w-full bg-slate-950 border border-rose-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-rose-50 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="group/input">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/30 mb-2 group-focus-within/input:text-cyan-400 transition-colors">Carbs</label>
              <input
                type="number"
                value={form.carbs_g}
                onChange={e => setForm({...form, carbs_g: e.target.value})}
                className="w-full bg-slate-950 border border-cyan-400/10 rounded-lg px-4 py-3.5 text-xs font-bold text-cyan-50 focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            <div className="group/input">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/30 mb-2 group-focus-within/input:text-amber-400 transition-colors">Fat</label>
              <input
                type="number"
                value={form.fat_g}
                onChange={e => setForm({...form, fat_g: e.target.value})}
                className="w-full bg-slate-950 border border-amber-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-amber-50 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full mt-6 flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] rounded-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400 group active:scale-95"
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
