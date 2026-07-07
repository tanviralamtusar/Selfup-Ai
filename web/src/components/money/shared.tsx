'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import {
  Wallet, Landmark, CreditCard, TrendingUp, Coins, Briefcase, Laptop, Gift,
  PlusCircle, Utensils, ShoppingCart, Home, Car, Plug, ShoppingBag,
  Clapperboard, HeartPulse, Repeat, GraduationCap, Circle, Tag, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Icon lookup for category / account icon strings ──
const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  wallet: Wallet, bank: Landmark, card: CreditCard, investment: TrendingUp, other: Coins,
  briefcase: Briefcase, laptop: Laptop, 'trending-up': TrendingUp, gift: Gift, 'plus-circle': PlusCircle,
  utensils: Utensils, 'shopping-cart': ShoppingCart, home: Home, car: Car, plug: Plug,
  'shopping-bag': ShoppingBag, clapperboard: Clapperboard, 'heart-pulse': HeartPulse,
  repeat: Repeat, 'graduation-cap': GraduationCap, tag: Tag, target: Target, circle: Circle,
}

export function MoneyIcon({ name, size = 16, className }: { name?: string | null; size?: number; className?: string }) {
  const Cmp = (name && ICONS[name]) || Tag
  return <Cmp size={size} className={className} />
}

export function AccountTypeIcon({ type, size = 16, className }: { type?: string | null; size?: number; className?: string }) {
  const map: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    cash: Wallet, bank: Landmark, card: CreditCard, investment: TrendingUp, other: Coins,
  }
  const Cmp = (type && map[type]) || Wallet
  return <Cmp size={size} className={className} />
}

// ── Modal shell ──
export function MoneyModal({
  open, onClose, title, children, wide,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className={cn('w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden', wide ? 'max-w-2xl' : 'max-w-md')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Form field wrapper ──
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground/70">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full bg-muted border border-border rounded-lg h-10 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-card transition-colors'

export const selectCls = inputCls + ' cursor-pointer'

// ── Segmented control ──
export function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex bg-muted border border-border rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 h-8 rounded-md text-sm font-medium transition-colors',
            value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Progress bar ──
export function Bar({ pct, color, danger }: { pct: number; color?: string; danger?: boolean }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${clamped}%`, backgroundColor: danger ? 'var(--destructive)' : color || 'var(--primary)' }}
      />
    </div>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
