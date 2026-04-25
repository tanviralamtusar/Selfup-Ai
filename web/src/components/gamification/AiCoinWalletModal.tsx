'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Plus, Minus, Loader2 } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { formatNumber } from '@/lib/utils'

interface Transaction {
  id: string
  amount: number
  reason: string
  balance_after: number
  created_at: string
}

interface AiCoinWalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AiCoinWalletModal({ isOpen, onClose }: AiCoinWalletModalProps) {
  const { profile, session } = useAuthStore()
  const coins = profile?.ai_coins ?? 0

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const res = await fetch('/api/user/transactions', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      fetchTransactions()
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen, fetchTransactions])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-slate-950 border border-blue-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col max-h-[85vh]"
          >
            {/* Header / Current Balance */}
            <div className="relative p-8 pb-10 text-center flex-shrink-0">
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded hover:bg-blue-500/10 text-blue-500/60 hover:text-blue-400 transition-colors z-10 border border-transparent hover:border-blue-500/20"
              >
                <X size={20} />
              </button>

              <div className="relative z-10 mt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-900 border border-blue-500/30 text-blue-400 mb-4 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]">
                  <Sparkles size={32} className="animate-pulse" />
                </div>
                <h2 className="text-blue-500/60 text-[10px] font-black uppercase tracking-[0.4em] mb-1 italic">Vessel Treasury</h2>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-blue-50 font-headline tracking-tighter system-text-glow">
                    {formatNumber(coins)}
                  </span>
                  <span className="text-blue-400/80 font-black tracking-[0.2em] text-lg uppercase italic">AiC</span>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto bg-slate-900/50 p-6 border-t border-blue-500/10 custom-scrollbar">
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500/40 mb-4 italic">Ledger History</h3>
              
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-blue-500/20 rounded-xl bg-slate-900/30">
                  <p className="text-blue-500/40 text-[10px] font-black uppercase tracking-[0.2em] italic">No transactions synchronized.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0
                    const date = new Date(tx.created_at)
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-blue-500/10 hover:border-blue-500/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded border flex items-center justify-center shadow-inner ${isPositive ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {isPositive ? <Plus size={16} /> : <Minus size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-blue-50 uppercase tracking-widest">{tx.reason}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/40 mt-0.5">
                              {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black font-headline tracking-wider ${isPositive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`}>
                            {isPositive ? '+' : ''}{tx.amount}
                          </p>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500/30">
                            Bal: {tx.balance_after}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
