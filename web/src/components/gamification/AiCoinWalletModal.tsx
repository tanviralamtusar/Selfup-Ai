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
            className="absolute inset-0 bg-background/80"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-background border border-border rounded-xl overflow-hidden  flex flex-col max-h-[85vh]"
          >
            {/* Header / Current Balance */}
            <div className="relative p-8 pb-10 text-center flex-shrink-0">
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors z-10 border border-transparent hover:border-border"
              >
                <X size={20} />
              </button>

              <div className="relative z-10 mt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-muted border border-border text-primary mb-4 ">
                  <img src="/coin.png" alt="AiCoins" className="w-10 h-10 object-contain animate-pulse" />
                </div>
                <h2 className="text-muted-foreground text-[10px]   mb-1 ">Vessel Treasury</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl  text-foreground font-headline tracking-tighter">
                    {formatNumber(coins)}
                  </span>
                  <img src="/coin.png" alt="AiCoins" className="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto bg-muted p-6 border-t border-border custom-scrollbar">
              <h3 className="text-[9px]   text-muted-foreground mb-4 ">Ledger History</h3>
              
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-xl bg-muted">
                  <p className="text-muted-foreground text-[10px]   ">No transactions synchronized.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0
                    const date = new Date(tx.created_at)
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border hover:border-border transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded border flex items-center justify-center shadow-inner ${isPositive ? 'bg-[#5db8a0]/10 text-[#5db8a0] border-border' : 'bg-rose-500/10 text-rose-400 border-destructive/20'}`}>
                            {isPositive ? <Plus size={16} /> : <Minus size={16} />}
                          </div>
                          <div>
                            <p className="text-xs  text-foreground">{tx.reason}</p>
                            <p className="text-[9px]   text-muted-foreground mt-0.5">
                              {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm  font-headline ${isPositive ? 'text-[#5db8a0] drop-' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{tx.amount}
                          </p>
                          <p className="text-[8px]   text-muted-foreground">
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
