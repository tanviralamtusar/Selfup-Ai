'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SystemFrameProps {
  children: React.ReactNode
  title?: string
  className?: string
  showScanline?: boolean
}

export function SystemFrame({ children, title, className, showScanline = true }: SystemFrameProps) {
  return (
    <div className={cn("relative group p-[2px]", className)}>
      {/* ─── OUTER GLOW ─── */}
      <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* ─── MAIN CONTAINER ─── */}
      <div className="relative bg-slate-950/90 backdrop-blur-md overflow-hidden flex flex-col min-h-[200px] border border-blue-500/30">
        
        {/* ─── TOP BAR (Solo Leveling Style) ─── */}
        <div className="relative h-12 flex items-center px-6 border-b border-blue-500/40 bg-blue-500/5">
          {/* Corner Elements */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
          
          {/* Decorative "Wings" */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-blue-500/40 blur-[1px]" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-blue-500/40 blur-[1px]" />

          {/* Title Area */}
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-full border border-blue-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
             </div>
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-blue-100 system-text-glow">
               {title || 'SELFUP NOTIFICATION'}
             </h3>
          </div>

          {/* Top Edge Detail */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-blue-400/50 blur-[2px]" />
        </div>

        {/* ─── CONTENT AREA ─── */}
        <div className="relative flex-1 p-8">
          {/* Internal Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          {/* Scanline Effect */}
          {showScanline && <div className="scanline" />}

          {/* Main Content */}
          <div className="relative z-10 h-full">
            {children}
          </div>
        </div>

        {/* ─── BOTTOM BAR DECORATION ─── */}
        <div className="h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
      </div>

      {/* ─── EXTERNAL WING ELEMENTS ─── */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 h-32 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-70" />
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 h-32 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-70" />
      
      {/* Decorative Bits */}
      <div className="absolute top-0 left-1/4 w-12 h-0.5 bg-blue-500/50" />
      <div className="absolute top-0 right-1/4 w-12 h-0.5 bg-blue-500/50" />
      <div className="absolute bottom-0 left-1/4 w-12 h-0.5 bg-blue-500/50" />
      <div className="absolute bottom-0 right-1/4 w-12 h-0.5 bg-blue-500/50" />
    </div>
  )
}
