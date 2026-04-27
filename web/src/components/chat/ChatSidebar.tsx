'use client'

import { cn } from '@/lib/utils'
import { MessageSquare, Trash2, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatRelative } from '@/lib/utils'

interface Conversation {
  id: string
  title: string
  updated_at: string
}

interface ChatSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  aiName?: string
}

export function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, aiName = 'SYSTEM' }: ChatSidebarProps) {
  return (
    <div className="w-80 flex flex-col bg-surface border-r border-outline-variant/10 h-full">
      <div className="p-4">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl border border-primary/20 transition-all font-bold text-sm btn-press"
        >
          <Plus size={18} />
          New Quest with {aiName}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Recent Conversations</p>
        
        {conversations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-on-surface-variant/40 italic">No history yet.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-xl transition-all group text-left cursor-pointer",
                activeId === conv.id 
                  ? "bg-surface-container-high border border-outline-variant/10 shadow-sm" 
                  : "hover:bg-surface-container-low border border-transparent"
              )}
            >
              <div className={cn(
                "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                activeId === conv.id ? "bg-primary/20 text-primary" : "bg-surface-container-highest text-on-surface-variant/60 group-hover:text-on-surface"
              )}>
                <MessageSquare size={14} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-bold truncate",
                  activeId === conv.id ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"
                )}>
                  {conv.title || 'New Chat'}
                </p>
                <p className="text-[10px] text-on-surface-variant/40 mt-0.5">
                  {formatRelative(conv.updated_at)}
                </p>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded-md text-on-surface-variant/40 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
