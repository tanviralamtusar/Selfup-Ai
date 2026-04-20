import React, { useState, useEffect } from 'react'
import { Droplet, Utensils, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function NutritionView() {
  const [foods, setFoods] = useState<any[]>([])
  const [waterAmount, setWaterAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ meal_type: 'snack', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hardcoded goals for now or fetched from nutrition_plans
  const goals = { calories: 2500, protein_g: 180, carbs_g: 250, fat_g: 80, water_ml: 3000 }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [foodRes, waterRes] = await Promise.all([
        fetch('/api/fitness/nutrition'),
        fetch('/api/fitness/water')
      ])
      const [foodData, waterData] = await Promise.all([foodRes.json(), waterRes.json()])
      
      setFoods(Array.isArray(foodData) ? foodData : [])
      
      const totalWater = Array.isArray(waterData) 
        ? waterData.reduce((acc, curr) => acc + curr.amount_ml, 0)
        : 0
      setWaterAmount(totalWater)
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
      const res = await fetch('/api/fitness/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/fitness/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-zinc-400 font-bold uppercase">{label}</span>
          <span className="font-bold">{Math.round(current)} / {target}g</span>
        </div>
        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className={`h-full rounded-full ${color}`}
          />
        </div>
      </div>
    )
  }

  if (loading) return <div className="h-48 rounded-xl bg-zinc-900/50 animate-pulse border border-zinc-800" />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ─── Macro & Water Tracking ─── */}
      <div className="space-y-8">
        <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Utensils size={20} className="text-green-500" /> 
              Macros Today
            </h2>
            <div className="text-right">
              <span className="text-2xl font-black">{Math.round(currentMacros.calories)}</span>
              <span className="text-xs text-zinc-500 uppercase font-bold ml-1">/ {goals.calories} kcal</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <MacroBar label="Protein" current={currentMacros.protein} target={goals.protein_g} color="bg-rose-500" />
            <MacroBar label="Carbs" current={currentMacros.carbs} target={goals.carbs_g} color="bg-blue-500" />
            <MacroBar label="Fat" current={currentMacros.fat} target={goals.fat_g} color="bg-amber-500" />
          </div>
        </section>

        <section className="bg-blue-900/10 border border-blue-900/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
              <Droplet size={20} /> 
              Hydration
            </h2>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-300">{waterAmount}</span>
              <span className="text-xs text-blue-500/50 uppercase font-bold ml-1">/ {goals.water_ml} ml</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {[250, 500, 1000].map(amount => (
              <button
                key={amount}
                onClick={() => handleAddWater(amount)}
                className="flex-1 py-3 bg-blue-950/30 hover:bg-blue-900/50 border border-blue-900/50 rounded-xl font-bold text-blue-300 transition-colors flex items-center justify-center gap-1 text-sm"
              >
                <Plus size={14} />{amount}ml
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ─── Add Meal Form ─── */}
      <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Log Food</h2>
        
        <form onSubmit={handleLogFood} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Meal / Food Name</label>
              <input
                required
                type="text"
                value={form.food_name}
                onChange={e => setForm({...form, food_name: e.target.value})}
                placeholder="e.g. Chicken breast w/ rice"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Meal Type</label>
              <select
                value={form.meal_type}
                onChange={e => setForm({...form, meal_type: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500/50"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Calories</label>
              <input
                type="number"
                value={form.calories}
                onChange={e => setForm({...form, calories: e.target.value})}
                placeholder="kcal"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Protein (g)</label>
              <input
                type="number"
                value={form.protein_g}
                onChange={e => setForm({...form, protein_g: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={form.carbs_g}
                onChange={e => setForm({...form, carbs_g: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Fat (g)</label>
              <input
                type="number"
                value={form.fat_g}
                onChange={e => setForm({...form, fat_g: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Log Food
          </button>
        </form>
      </section>
    </div>
  )
}
