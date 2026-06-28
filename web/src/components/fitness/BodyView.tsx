import React, { useState, useEffect } from 'react'
import { Activity, Plus, Loader2, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

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
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/fitness/body', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
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
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/fitness/body', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 ">
      {/* ─── Log Metrics Form ─── */}
      <section className="bg-background border border-border rounded-xl p-8 relative overflow-hidden group h-fit">
        <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="p-2 rounded bg-rose-500/10 text-rose-400 border border-destructive/20">
            <Activity size={20} />
          </div>
          <h2 className="text-[10px]   text-muted-foreground">Body Stats</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-6">
            <div className="group/input">
              <label className="block text-[10px]   text-muted-foreground mb-2 group-focus-within/input:text-primary transition-colors">Weight (KG)</label>
              <input
                type="number" step="0.1"
                value={form.weight_kg}
                onChange={e => setForm({...form, weight_kg: e.target.value})}
                placeholder="75.5"
                className="w-full bg-background border border-border rounded-lg px-4 py-3.5 text-xs font-medium text-foreground focus:outline-none focus:border-border transition-colors placeholder:text-muted-foreground"
              />
            </div>
            <div className="group/input">
              <label className="block text-[10px]   text-rose-500/30 mb-2 group-focus-within/input:text-rose-400 transition-colors">Body Fat (%)</label>
              <input
                type="number" step="0.1"
                value={form.body_fat_pct}
                onChange={e => setForm({...form, body_fat_pct: e.target.value})}
                placeholder="15.0"
                className="w-full bg-background border border-destructive/20 rounded-lg px-4 py-3.5 text-xs font-medium text-rose-50 focus:outline-none focus:border-rose-500/50 transition-colors placeholder:text-rose-500/10"
              />
            </div>
            <div className="group/input">
              <label className="block text-[10px]   text-muted-foreground mb-2 group-focus-within/input:text-primary transition-colors">Waist (CM)</label>
              <input
                type="number" step="0.1"
                value={form.waist_cm}
                onChange={e => setForm({...form, waist_cm: e.target.value})}
                placeholder="80.0"
                className="w-full bg-background border border-border rounded-lg px-4 py-3.5 text-xs font-medium text-foreground focus:outline-none focus:border-border transition-colors placeholder:text-muted-foreground"
              />
            </div>
            <div className="group/input">
              <label className="block text-[10px]   text-muted-foreground mb-2 group-focus-within/input:text-primary transition-colors">Chest (CM)</label>
              <input
                type="number" step="0.1"
                value={form.chest_cm}
                onChange={e => setForm({...form, chest_cm: e.target.value})}
                placeholder="100.0"
                className="w-full bg-background border border-border rounded-lg px-4 py-3.5 text-xs font-medium text-foreground focus:outline-none focus:border-border transition-colors placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full mt-6 flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary text-white   rounded-lg transition-all  border border-primary/30 group active:scale-95"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />}
            Save Stats
          </button>
        </form>
      </section>

      {/* ─── Metrics History ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2 rounded bg-primary/10 text-primary border border-border">
            <TrendingDown size={20} />
          </div>
          <h2 className="text-[10px]   text-muted-foreground">History</h2>
        </div>
        
        {loading ? (
          <div className="h-64 rounded-xl bg-card animate-pulse border border-border " />
        ) : metrics.length === 0 ? (
          <div className="text-muted-foreground text-[10px]   py-16 text-center border border-dashed border-border rounded-xl bg-background/20 relative overflow-hidden group">
            <div className="absolute inset-0 scanline pointer-events-none opacity-[0.02]" />
            No history found.
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map(m => (
              <div key={m.id} className="bg-background border border-border rounded-xl p-5 flex justify-between items-center hover:border-border transition-all hover:bg-muted relative overflow-hidden group">
                <div className="absolute inset-0 scanline pointer-events-none opacity-[0.03]" />
                <div className="relative z-10">
                  <span className="block text-[8px] text-muted-foreground mb-2  ">
                    {new Date(m.logged_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                  </span>
                  <div className="flex gap-6">
                    {m.weight_kg && (
                      <div className="group/metric">
                        <span className="text-xl  text-foreground group-hover/metric:transition-all">{m.weight_kg}</span>
                        <span className="text-[10px] text-muted-foreground ml-2 ">KG</span>
                      </div>
                    )}
                    {m.body_fat_pct && (
                      <div className="group/metric">
                        <span className="text-xl  text-rose-400 group-hover/metric:transition-all">{m.body_fat_pct}</span>
                        <span className="text-[10px] text-rose-500/30 ml-2 ">% BODY FAT</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-6 relative z-10">
                  {m.waist_cm && (
                    <div className="text-left">
                      <span className="block text-[8px] text-muted-foreground   mb-1">Waist</span>
                      <span className="text-xs  text-foreground/80">{m.waist_cm}</span>
                    </div>
                  )}
                  {m.chest_cm && (
                    <div className="text-left">
                      <span className="block text-[8px] text-muted-foreground   mb-1">Chest</span>
                      <span className="text-xs  text-foreground/80">{m.chest_cm}</span>
                    </div>
                  )}
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/40 transition-all" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
