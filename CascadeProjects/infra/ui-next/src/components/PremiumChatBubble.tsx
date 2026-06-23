'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface MessageMetadata {
  model?: string
  provider?: string
  generationTime?: number
  tokenCount?: number
  temperature?: number
}

interface PremiumChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  metadata?: MessageMetadata
  timestamp?: Date
}

export default function PremiumChatBubble({ role, content, metadata, timestamp }: PremiumChatBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-slide-up`}>
      <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message Bubble */}
        <div className={`
          rounded-2xl px-6 py-4 shadow-lg
          ${isUser 
            ? 'bg-runtime-600 text-white rounded-tr-sm' 
            : 'bg-historical-800 text-historical-100 rounded-tl-sm border border-historical-700'
          }
        `}>
          <div className="prose prose-invert max-w-none">
            {content}
          </div>
        </div>

        {/* Metadata Bar */}
        {metadata && !isUser && (
          <div className="mt-2 flex items-center gap-4 text-xs text-historical-400">
            {metadata.model && (
              <span className="flex items-center gap-1">
                <span className="text-constitutional-400">Model:</span> {metadata.model}
              </span>
            )}
            {metadata.provider && (
              <span className="flex items-center gap-1">
                <span className="text-runtime-400">Provider:</span> {metadata.provider}
              </span>
            )}
            {metadata.generationTime && (
              <span className="flex items-center gap-1">
                <span className="text-observability-400">Time:</span> {metadata.generationTime.toFixed(2)}s
              </span>
            )}
            {metadata.tokenCount && (
              <span className="flex items-center gap-1">
                <span className="text-retrieval-400">Tokens:</span> {metadata.tokenCount}
              </span>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-2 flex items-center gap-2">
          {timestamp && (
            <span className="text-xs text-historical-500">
              {timestamp.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="text-historical-500 hover:text-historical-300 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-learning-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
