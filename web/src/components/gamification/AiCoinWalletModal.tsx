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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-surface-container-low border border-primary/20 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header / Current Balance */}
            <div className="relative p-8 pb-10 text-center flex-shrink-0">
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="relative z-10 mt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-inner">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-on-surface-variant text-sm font-black uppercase tracking-widest mb-1">Your Balance</h2>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-on-surface font-headline tracking-tighter">
                    {formatNumber(coins)}
                  </span>
                  <span className="text-primary font-black tracking-widest text-lg">AiC</span>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-6 border-t border-outline-variant/10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-4">Transaction History</h3>
              
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-on-surface-variant/50 text-sm font-medium">No transactions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0
                    const date = new Date(tx.created_at)
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-surface-container-high text-on-surface-variant'}`}>
                            {isPositive ? <Plus size={16} /> : <Minus size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-on-surface">{tx.reason}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
                              {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${isPositive ? 'text-green-500' : 'text-on-surface'}`}>
                            {isPositive ? '+' : ''}{tx.amount}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
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
