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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 italic">
      {/* ─── Log Metrics Form ─── */}
      <section className="bg-slate-950 border border-blue-500/20 rounded-xl p-8 relative overflow-hidden group h-fit">
        <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="p-2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Activity size={20} />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">Vessel Calibration</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-6">
            <div className="group/input">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/30 mb-2 group-focus-within/input:text-blue-400 transition-colors">Mass (KG)</label>
              <input
                type="number" step="0.1"
                value={form.weight_kg}
                onChange={e => setForm({...form, weight_kg: e.target.value})}
                placeholder="75.5"
                className="w-full bg-slate-950 border border-blue-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-blue-50 focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-blue-500/10"
              />
            </div>
            <div className="group/input">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/30 mb-2 group-focus-within/input:text-rose-400 transition-colors">Adipose Index (%)</label>
              <input
                type="number" step="0.1"
                value={form.body_fat_pct}
                onChange={e => setForm({...form, body_fat_pct: e.target.value})}
                placeholder="15.0"
                className="w-full bg-slate-950 border border-rose-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-rose-50 focus:outline-none focus:border-rose-500/50 transition-colors placeholder:text-rose-500/10"
              />
            </div>
            <div className="group/input">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/30 mb-2 group-focus-within/input:text-blue-400 transition-colors">Axial (CM)</label>
              <input
                type="number" step="0.1"
                value={form.waist_cm}
                onChange={e => setForm({...form, waist_cm: e.target.value})}
                placeholder="80.0"
                className="w-full bg-slate-950 border border-blue-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-blue-50 focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-blue-500/10"
              />
            </div>
            <div className="group/input">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/30 mb-2 group-focus-within/input:text-blue-400 transition-colors">Thoracic (CM)</label>
              <input
                type="number" step="0.1"
                value={form.chest_cm}
                onChange={e => setForm({...form, chest_cm: e.target.value})}
                placeholder="100.0"
                className="w-full bg-slate-950 border border-blue-500/10 rounded-lg px-4 py-3.5 text-xs font-bold text-blue-50 focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-blue-500/10"
              />
            </div>
          </div>
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full mt-6 flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] rounded-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400 group active:scale-95"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />}
            Initialize Calibration
          </button>
        </form>
      </section>

      {/* ─── Metrics History ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingDown size={20} />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">Calibration History</h2>
        </div>
        
        {loading ? (
          <div className="h-64 rounded-xl bg-slate-950/40 animate-pulse border border-blue-500/10 shadow-[inset_0_0_30px_rgba(59,130,246,0.05)]" />
        ) : metrics.length === 0 ? (
          <div className="text-blue-500/20 text-[10px] font-black uppercase tracking-[0.2em] py-16 text-center border border-dashed border-blue-500/20 rounded-xl bg-slate-950/20 relative overflow-hidden group">
            <div className="absolute inset-0 scanline pointer-events-none opacity-[0.02]" />
            No structural traces detected.
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map(m => (
              <div key={m.id} className="bg-slate-950 border border-blue-500/10 rounded-xl p-5 flex justify-between items-center hover:border-blue-500/40 transition-all hover:bg-blue-900/10 relative overflow-hidden group">
                <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
                <div className="relative z-10">
                  <span className="block text-[8px] text-blue-500/30 mb-2 font-black uppercase tracking-[0.2em]">
                    {new Date(m.logged_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                  </span>
                  <div className="flex gap-6">
                    {m.weight_kg && (
                      <div className="group/metric">
                        <span className="text-xl font-black text-blue-50 group-hover/metric:system-text-glow transition-all">{m.weight_kg}</span>
                        <span className="text-[10px] text-blue-500/30 ml-2 font-black">KG</span>
                      </div>
                    )}
                    {m.body_fat_pct && (
                      <div className="group/metric">
                        <span className="text-xl font-black text-rose-400 group-hover/metric:system-text-glow transition-all">{m.body_fat_pct}</span>
                        <span className="text-[10px] text-rose-500/30 ml-2 font-black">% ADIPOSE</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-6 relative z-10">
                  {m.waist_cm && (
                    <div className="text-left">
                      <span className="block text-[8px] text-blue-500/30 uppercase font-black tracking-[0.2em] mb-1">Axial</span>
                      <span className="text-xs font-black text-blue-200">{m.waist_cm}</span>
                    </div>
                  )}
                  {m.chest_cm && (
                    <div className="text-left">
                      <span className="block text-[8px] text-blue-500/30 uppercase font-black tracking-[0.2em] mb-1">Thoracic</span>
                      <span className="text-xs font-black text-blue-200">{m.chest_cm}</span>
                    </div>
                  )}
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/0 group-hover:bg-blue-500/40 transition-all" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
