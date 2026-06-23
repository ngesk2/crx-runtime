'use client'

import { Send, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

export default function MessageInput({ onSendMessage, disabled = false, isLoading = false, placeholder = 'Type your message...' }: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const handleSubmit = () => {
    if (!input.trim() || disabled || isLoading) return
    onSendMessage(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="bg-historical-800 border-t border-historical-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3 bg-historical-900 rounded-2xl border border-historical-700 p-3 focus-within:border-runtime-500 focus-within:ring-2 focus-within:ring-runtime-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="flex-1 bg-transparent text-historical-100 placeholder-historical-500 resize-none outline-none min-h-[24px] max-h-[200px] py-2 text-base leading-relaxed"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled || isLoading}
            className="p-2 rounded-lg bg-runtime-600 hover:bg-runtime-500 disabled:bg-historical-700 disabled:text-historical-500 text-white transition-all flex items-center justify-center min-w-[36px] h-[36px]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="text-center mt-2 text-xs text-historical-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
