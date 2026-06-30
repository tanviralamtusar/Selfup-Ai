'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Link2, Plus, Loader2, X } from 'lucide-react'

interface MoodboardItem {
  id: string
  title: string
  image_url: string
  link_url: string
  notes: string
}

export function Moodboard({ items, onAdd, onDelete }: { items: MoodboardItem[], onAdd: (v: any) => Promise<void>, onDelete?: (id: string) => Promise<void> }) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() && !imageUrl.trim()) return
    setLoading(true)
    await onAdd({ title, image_url: imageUrl, link_url: linkUrl, notes: '' })
    setLoading(false)
    setIsAdding(false)
    setTitle('')
    setImageUrl('')
    setLinkUrl('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl  text-foreground flex items-center gap-2">
          Moodboard <span className="text-xs px-2 py-1 bg-muted rounded-full">{items.length}</span>
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted text-xs  transition-all"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />} {isAdding ? 'Cancel' : 'Add Pin'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted border border-border rounded-3xl p-6 mb-6 grid gap-4 grid-cols-1 md:grid-cols-2">
              <input
                type="text"
                placeholder="Title (e.g. Winter layering)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="col-span-1 md:col-span-2 bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
              />
              <div className="relative">
                <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Image URL..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
                />
              </div>
              <div className="relative">
                <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Link URL (optional)..."
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-pink-500/50"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || (!title && !imageUrl)}
                className="col-span-1 md:col-span-2 py-3 rounded-xl bg-pink-500 text-primary-foreground  text-xs hover:bg-pink-400 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Pin to Moodboard'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {items.map(item => (
          <div key={item.id} className="break-inside-avoid relative group rounded-xl overflow-hidden bg-muted border border-border">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-auto object-cover" />
            ) : (
              <div className="w-full aspect-square bg-muted flex flex-col items-center justify-center p-4 text-center">
                <ImageIcon size={24} className="text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">{item.title}</p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <h4 className="text-white font-medium text-sm line-clamp-2">{item.title}</h4>
              {item.link_url && (
                <a href={item.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-pink-400 mt-2 hover:underline">
                  <Link2 size={12} /> Visit Link
                </a>
              )}
            </div>
            
            {onDelete && (
              <button 
                onClick={() => onDelete(item.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-primary-foreground/70 hover:text-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      {items.length === 0 && !isAdding && (
         <div className="py-20 text-center border border-dashed border-border rounded-3xl">
           <ImageIcon size={48} className="mx-auto text-muted-foreground mb-4" />
           <h3 className="text-xl  text-muted-foreground">Empty Space</h3>
           <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
             Start gathering inspiration. Add URLs of clothes and fits you like.
           </p>
         </div>
      )}
    </div>
  )
}
