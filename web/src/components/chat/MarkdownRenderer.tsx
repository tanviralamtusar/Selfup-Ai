'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose-chat", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({node, ...props}) => <h1 className="text-xl font-headline font-medium text-gradient mt-6 mb-3" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-headline font-medium text-primary mt-5 mb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-md font-headline font-medium text-foreground mt-4 mb-2" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-sm font-headline font-medium text-muted-foreground mt-3 mb-1" {...props} />,
          
          // Paragraphs
          p: ({node, ...props}) => <p className="text-sm leading-relaxed mb-3 last:mb-0 text-foreground" {...props} />,
          
          // Lists
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 text-sm space-y-1 marker:text-primary/70" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 text-sm space-y-1 marker:text-primary/70" {...props} />,
          li: ({node, className, ...props}) => (
            <li className={cn("text-foreground", className)} {...props} />
          ),
          
          // Checkboxes
          input: ({node, type, checked, ...props}) => {
            if (type === 'checkbox') {
              return (
                <input 
                  type="checkbox" 
                  checked={checked} 
                  readOnly 
                  className="mr-2 w-3.5 h-3.5 accent-primary bg-mutedest border-border rounded-sm inline-block align-middle"
                  {...props} 
                />
              )
            }
            return <input type={type} {...props} />
          },
          
          // Inline formatting
          strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
          em: ({node, ...props}) => <em className="italic text-muted-foreground" {...props} />,
          
          // Pre
          pre: ({ children }) => <>{children}</>,
          
          // Code
          code: ({node, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isBlock = match || String(children).includes('\n')
            
            if (!isBlock) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-mutedest text-primary font-mono text-[11px] whitespace-pre-wrap break-words" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <div className="my-3 rounded-lg overflow-hidden border border-border bg-mutedest">
                <div className="px-3 py-1.5 bg-mutedest/50 border-b border-border flex items-center">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {match?.[1] || 'Code'}
                  </span>
                </div>
                <div className="p-3 overflow-x-auto">
                  <code className={cn("font-mono text-xs text-foreground whitespace-pre", className)} {...props}>
                    {children}
                  </code>
                </div>
              </div>
            )
          },
          
          // Blockquotes
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-2 border-primary/50 pl-3 py-1 my-3 bg-primary/5 rounded-r-md  text-muted-foreground" {...props} />
          ),
          
          // Tables
          table: ({node, ...props}) => (
            <div className="overflow-x-auto mb-4 border border-border rounded-lg">
              <table className="w-full text-sm text-left" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-mutedest/50 border-b border-border text-xs text-muted-foreground" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-2 font-medium" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-2 border-b border-border text-foreground" {...props} />,
          
          // Links
          a: ({node, ...props}) => (
            <a className="text-primary hover:text-secondary underline underline-offset-2 decoration-primary/30 hover:decoration-secondary transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          
          // Dividers
          hr: ({node, ...props}) => <hr className="my-5 border-t border-border" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
