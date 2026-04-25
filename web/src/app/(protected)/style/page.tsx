'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette, Sparkles, Loader2, Plus, Star, ShoppingBag,
  Tag, Shirt, ChevronDown, RefreshCw, Heart, Camera, Image as ImageIcon
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { OutfitLogCard } from '@/components/style/OutfitLogCard'
import { Moodboard } from '@/components/style/Moodboard'

type BudgetRange = 'budget' | 'medium' | 'premium' | 'luxury'

interface StyleProfile {
  body_type: string | null
  style_preferences: string[]
  budget_range: BudgetRange
}

interface Recommendation {
  id: string
  occasion: string
  items: Array<{ name: string; type: string; color: string; brand?: string }>
  is_ai_generated: boolean
  created_at: string
}

const STYLE_TAGS = ['Casual', 'Streetwear', 'Business', 'Minimalist', 'Athletic', 'Formal', 'Boho', 'Techwear']
const OCCASIONS = ['Work', 'Date Night', 'Gym', 'Weekend', 'Formal Event', 'Night Out', 'Travel']
const BUDGET_CONFIG: Record<BudgetRange, { label: string; color: string }> = {
  budget:  { label: 'Budget',  color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  medium:  { label: 'Medium',  color: 'text-primary bg-primary/10 border-primary/20' },
  premium: { label: 'Premium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  luxury:  { label: 'Luxury',  color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
}

// Demo recommendations shown when DB is empty
const DEMO_RECS: Recommendation[] = [
  {
    id: 'demo-1',
    occasion: 'Work',
    is_ai_generated: true,
    created_at: new Date().toISOString(),
    items: [
      { name: 'Slim-fit Oxford Shirt', type: 'Top', color: 'Navy Blue' },
      { name: 'Tailored Chinos', type: 'Bottom', color: 'Sand Beige' },
      { name: 'Derby Shoes', type: 'Shoes', color: 'Cognac Brown' },
      { name: 'Minimalist Watch', type: 'Accessory', color: 'Silver' },
    ]
  },
  {
    id: 'demo-2',
    occasion: 'Weekend',
    is_ai_generated: true,
    created_at: new Date().toISOString(),
    items: [
      { name: 'Graphic Tee', type: 'Top', color: 'Washed Black' },
      { name: 'Jogger Pants', type: 'Bottom', color: 'Charcoal' },
      { name: 'Air Force 1', type: 'Shoes', color: 'White' },
      { name: 'Cap', type: 'Accessory', color: 'Tan' },
    ]
  }
]

const ITEM_TYPE_ICON: Record<string, string> = {
  Top: '👕', Bottom: '👖', Shoes: '👟', Accessory: '⌚', Jacket: '🧥', Bag: '👜'
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 hover:border-outline-variant/20 transition-all relative overflow-hidden group"
    >
      {rec.is_ai_generated && (
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/3 blur-3xl rounded-full pointer-events-none" />
      )}
      <div className="flex items-start justify-between mb-5">
        <div>
          {rec.is_ai_generated && (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-1 rounded-full mb-2">
              <Sparkles size={8} /> System Pick
            </span>
          )}
          <h3 className="text-base font-black text-on-surface">{rec.occasion}</h3>
          <p className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-widest mt-0.5">
            {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button className="p-2 rounded-xl hover:bg-error/10 text-on-surface-variant/30 hover:text-error transition-all">
          <Heart size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(rec.items || []).map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-medium/50 border border-outline-variant/5">
            <span className="text-lg leading-none">{ITEM_TYPE_ICON[item.type] || '👔'}</span>
            <div className="min-w-0">
              <p className="text-xs font-black text-on-surface truncate">{item.name}</p>
              <p className="text-[10px] text-on-surface-variant/40 font-medium">{item.color}</p>
              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/30">{item.type}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function StylePage() {
  const { session } = useAuthStore()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [outfitLogs, setOutfitLogs] = useState<any[]>([])
  const [moodboardItems, setMoodboardItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'system' | 'moodboard' | 'log'>('system')
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedOccasion, setSelectedOccasion] = useState('Work')
  const [selectedBudget, setSelectedBudget] = useState<BudgetRange>('medium')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [showSetup, setShowSetup] = useState(false)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  useEffect(() => {
    if (session?.access_token) {
      fetchData()
      fetchOutfits()
      fetchMoodboard()
    }
  }, [session])

  const fetchOutfits = async () => {
    try {
      const res = await fetch('/api/style/outfits', { headers: headers() })
      if (res.ok) setOutfitLogs(await res.json())
    } catch { console.error('Failed to load outfits') }
  }

  const fetchMoodboard = async () => {
    try {
      const res = await fetch('/api/style/moodboard', { headers: headers() })
      if (res.ok) setMoodboardItems(await res.json())
    } catch { console.error('Failed to load moodboard') }
  }

  const handleAddOutfit = async (data: any) => {
    try {
      const res = await fetch('/api/style/outfits', {
        method: 'POST', headers: headers(), body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Outfit logged!')
        fetchOutfits()
      } else throw new Error()
    } catch { toast.error('Failed to log outfit') }
  }

  const handleAddMoodboard = async (data: any) => {
    try {
      const res = await fetch('/api/style/moodboard', {
        method: 'POST', headers: headers(), body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Added to moodboard!')
        fetchMoodboard()
      } else throw new Error()
    } catch { toast.error('Failed to add to moodboard') }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/style/recommendations', { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.recommendations?.length ? data.recommendations : DEMO_RECS)
        setStyleProfile(data.styleProfile)
        if (data.styleProfile) {
          setSelectedBudget(data.styleProfile.budget_range || 'medium')
          setSelectedStyles(data.styleProfile.style_preferences || [])
        }
      }
    } catch { setRecommendations(DEMO_RECS) }
    finally { setIsLoading(false) }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/style/recommendations', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          occasion: selectedOccasion,
          style_preferences: selectedStyles,
          budget_range: selectedBudget
        })
      })
      if (res.ok) {
        toast.success('System is crafting your look! Check back in a moment.')
      }
    } catch { toast.error('Failed to generate recommendation') }
    finally { setIsGenerating(false) }
  }

  const toggleStyle = (s: string) => {
    setSelectedStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.08)]">
            <Palette size={28} className="text-pink-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black font-headline tracking-tighter text-on-surface">Style Architect</h1>
            <p className="text-on-surface-variant/60 text-sm">AI-curated looks for every version of you.</p>
          </div>
        </div>
        <button
          onClick={() => setShowSetup(prev => !prev)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30 text-xs font-black uppercase tracking-widest transition-all"
        >
          <Shirt size={16} /> Style Setup
        </button>
      </div>

      {/* Setup Panel */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Your Style DNA</h3>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-3">Style Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {STYLE_TAGS.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleStyle(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                        selectedStyles.includes(s)
                          ? 'bg-primary text-on-primary border-primary shadow-sm shadow-primary/20'
                          : 'border-outline-variant/10 text-on-surface-variant hover:border-primary/30'
                      )}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-3">Budget Range</p>
                <div className="flex gap-2">
                  {(Object.keys(BUDGET_CONFIG) as BudgetRange[]).map(b => (
                    <button
                      key={b}
                      onClick={() => setSelectedBudget(b)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                        selectedBudget === b ? BUDGET_CONFIG[b].color : 'border-outline-variant/10 text-on-surface-variant/40'
                      )}
                    >{BUDGET_CONFIG[b].label}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-surface-container-low border border-outline-variant/10 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('system')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'system' ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
          )}
        >
          <Sparkles size={14} className="inline mr-2" /> System Picks
        </button>
        <button
          onClick={() => setActiveTab('moodboard')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'moodboard' ? 'bg-pink-500/10 text-pink-400 shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
          )}
        >
          <ImageIcon size={14} className="inline mr-2" /> Moodboard
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'log' ? 'bg-amber-500/10 text-amber-400 shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
          )}
        >
          <Camera size={14} className="inline mr-2" /> Outfit Log
        </button>
      </div>

      {activeTab === 'system' && (
        <div className="space-y-8">
          {/* Generate Strip */}
      <div className="bg-gradient-to-r from-surface-container-low to-surface-container-medium border border-outline-variant/10 rounded-3xl p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-2">Generate for Occasion</p>
            <div className="flex gap-2 flex-wrap">
              {OCCASIONS.map(o => (
                <button
                  key={o}
                  onClick={() => setSelectedOccasion(o)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                    selectedOccasion === o
                      ? 'bg-pink-500/20 text-pink-400 border-pink-500/30'
                      : 'border-outline-variant/10 text-on-surface-variant/50 hover:border-pink-500/20'
                  )}
                >{o}</button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-pink-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:bg-pink-400 transition-all active:scale-95 disabled:opacity-60"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isGenerating ? 'System Styling...' : 'Generate Look'}
          </button>
        </div>
      </div>

          {isLoading ? (
            <div className="py-24 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map(rec => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'moodboard' && (
        <Moodboard items={moodboardItems} onAdd={handleAddMoodboard} />
      )}

      {activeTab === 'log' && (
        <OutfitLogCard logs={outfitLogs} onAdd={handleAddOutfit} />
      )}
    </div>
  )
}
