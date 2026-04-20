import React, { useState, useEffect } from 'react'
import { Activity, Plus, Loader2, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export default function BodyView() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    weight_kg: '', body_fat_pct: '', waist_cm: '', chest_cm: ''
  })

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/fitness/body')
      const data = await res.json()
      setMetrics(Array.isArray(data) ? data : [])
    } catch(err) {
      toast.error('Failed to load body metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.weight_kg && !form.body_fat_pct) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/fitness/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight_kg: parseFloat(form.weight_kg) || null,
          body_fat_pct: parseFloat(form.body_fat_pct) || null,
          waist_cm: parseFloat(form.waist_cm) || null,
          chest_cm: parseFloat(form.chest_cm) || null
        })
      })

      if (res.ok) {
        toast.success('Body metrics logged')
        setForm({ weight_kg: '', body_fat_pct: '', waist_cm: '', chest_cm: '' })
        fetchMetrics()
      } else {
        toast.error('Failed to log metrics')
      }
    } catch(err) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ─── Log Metrics Form ─── */}
      <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 h-fit">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Activity size={20} className="text-pink-500" />
          Log Body Metrics
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Weight (kg)</label>
              <input
                type="number" step="0.1"
                value={form.weight_kg}
                onChange={e => setForm({...form, weight_kg: e.target.value})}
                placeholder="e.g. 75.5"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Body Fat (%)</label>
              <input
                type="number" step="0.1"
                value={form.body_fat_pct}
                onChange={e => setForm({...form, body_fat_pct: e.target.value})}
                placeholder="e.g. 15.0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Waist (cm)</label>
              <input
                type="number" step="0.1"
                value={form.waist_cm}
                onChange={e => setForm({...form, waist_cm: e.target.value})}
                placeholder="e.g. 80.0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Chest (cm)</label>
              <input
                type="number" step="0.1"
                value={form.chest_cm}
                onChange={e => setForm({...form, chest_cm: e.target.value})}
                placeholder="e.g. 100.0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500/50"
              />
            </div>
          </div>
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition-colors"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Log Metrics
          </button>
        </form>
      </section>

      {/* ─── Metrics History ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingDown size={20} className="text-zinc-500" />
          Recent Logs
        </h2>
        
        {loading ? (
          <div className="h-48 rounded-xl bg-zinc-900/50 animate-pulse border border-zinc-800" />
        ) : metrics.length === 0 ? (
          <div className="text-zinc-500 text-sm italic py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
            No metrics logged yet. Track your progress here.
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.map(m => (
              <div key={m.id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex justify-between items-center hover:border-zinc-700 transition-colors">
                <div>
                  <span className="block text-xs text-zinc-500 mb-1 font-bold">
                    {new Date(m.logged_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                  </span>
                  <div className="flex gap-4">
                    {m.weight_kg && <div><span className="text-lg font-black text-white">{m.weight_kg}</span><span className="text-xs text-zinc-500 ml-1">kg</span></div>}
                    {m.body_fat_pct && <div><span className="text-lg font-black text-pink-400">{m.body_fat_pct}</span><span className="text-xs text-pink-500 ml-1">%</span></div>}
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-3">
                  {m.waist_cm && <div className="text-left"><span className="block text-[10px] text-zinc-500 uppercase font-bold">Waist</span><span className="text-sm font-bold">{m.waist_cm}</span></div>}
                  {m.chest_cm && <div className="text-left"><span className="block text-[10px] text-zinc-500 uppercase font-bold">Chest</span><span className="text-sm font-bold">{m.chest_cm}</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
