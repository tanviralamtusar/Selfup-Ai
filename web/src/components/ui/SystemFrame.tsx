'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SystemFrameProps {
  children: React.ReactNode
  title?: string
  className?: string
  showScanline?: boolean
}

export function SystemFrame({ children, title, className }: SystemFrameProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden shadow-md", className)}>
      {title && (
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
