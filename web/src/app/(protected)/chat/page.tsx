'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Trash2, Menu, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  title: string
  updated_at: string
}

export default function ChatPage() {
  const { profile, session, setProfile } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch initial conversations
  useEffect(() => {
    if (session?.access_token) {
      fetchConversations()
    }
  }, [session])

  // Fetch messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
    } else {
      setMessages([{ 
        role: 'assistant', 
        content: `Greetings, ${profile?.display_name || 'Pathfinder'}. I am Nova, your AI life-coach. How shall we accelerate your progress toward mastery today?` 
      }])
    }
  }, [activeConversationId])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/ai/chat', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (res.ok) setConversations(data)
    } catch (err) {
      console.error('Failed to fetch conversations', err)
    }
  }

  const fetchMessages = async (id: string) => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/ai/chat?conversationId=${id}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(data.map((m: any) => ({ role: m.role, content: m.content })))
      }
    } catch (err) {
      toast.error('Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!session?.access_token) return
    if ((profile?.ai_coins || 0) < 1) {
      toast.error('Insufficient AiCoins.')
      return
    }

    const newUserMessage: Message = { role: 'user', content }
    setMessages(prev => [...prev, newUserMessage])
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ content, conversationId: activeConversationId })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      
      if (!activeConversationId) {
        setActiveConversationId(data.conversationId)
        fetchConversations() // Refresh sidebar
      }

      if (profile) setProfile({ ...profile, ai_coins: data.coinsRemaining })

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = () => {
    setActiveConversationId(null)
    setMessages([{ 
      role: 'assistant', 
      content: `New session started. How can I assist you in your next quest?` 
    }])
  }

  return (
    <div className="flex bg-background h-[calc(100vh-100px)] -m-6 rounded-3xl overflow-hidden border border-outline-variant/10 shadow-2xl">
      {/* ─── Sidebar ─── */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="hidden md:block"
          >
            <ChatSidebar 
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={setActiveConversationId}
              onNew={startNewChat}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col relative bg-surface-container-low/20">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 glass z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Brain size={20} className="text-primary" />
              <span className="font-headline font-bold text-lg">Nova</span>
              <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">AI Companion</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-highest/50 border border-outline-variant/10">
                <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">AiC:</span>
                <span className="text-sm font-black text-on-surface">{profile?.ai_coins || 0}</span>
             </div>
             <button onClick={startNewChat} className="p-2 hover:bg-surface-container-highest rounded-lg text-on-surface-variant">
               <Plus size={20} />
             </button>
          </div>
        </div>

        {/* Message List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-2 scrollbar-thin scrollbar-thumb-primary/20"
        >
          {messages.map((msg, i) => (
            <ChatMessage 
              key={i} 
              role={msg.role} 
              content={msg.content} 
              isLast={i === messages.length - 1 && isLoading && msg.role === 'assistant'}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <ChatMessage role="assistant" content="" isLast />
          )}
        </div>

        {/* Input Area */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSendMessage} isDisabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
