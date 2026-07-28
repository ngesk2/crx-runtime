'use client'

import { useState, useEffect } from 'react'
import { Cpu, Network, Activity, Clock, Database, Zap } from 'lucide-react'

interface RuntimeStatus {
  model: string
  gateway: 'healthy' | 'unhealthy' | 'unknown'
  ollama: 'connected' | 'disconnected' | 'unknown'
  streaming: boolean
  latency: number
  contextUsage: number
}

export default function MissionControlHeader() {
  const [status, setStatus] = useState<RuntimeStatus>({
    model: 'qwen3-coder',
    gateway: 'healthy',
    ollama: 'connected',
    streaming: false,
    latency: 0,
    contextUsage: 0
  })

  useEffect(() => {
    // Simulate runtime updates
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        latency: Math.random() * 100 + 50,
        contextUsage: Math.random() * 4096
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-historical-900 border-b border-historical-700 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Model */}
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-constitutional-400" />
            <span className="text-historical-200 text-sm font-medium">{status.model}</span>
          </div>

          {/* Gateway */}
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-runtime-400" />
            <span className="text-historical-200 text-sm">
              Gateway <span className={`text-xs ${status.gateway === 'healthy' ? 'text-learning-400' : 'text-production-400'}`}>
                {status.gateway}
              </span>
            </span>
          </div>

          {/* Ollama */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-observability-400" />
            <span className="text-historical-200 text-sm">
              Ollama <span className={`text-xs ${status.ollama === 'connected' ? 'text-learning-400' : 'text-production-400'}`}>
                {status.ollama}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Streaming */}
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${status.streaming ? 'text-constitutional-400 animate-pulse' : 'text-historical-500'}`} />
            <span className="text-historical-200 text-sm">
              {status.streaming ? `${Math.floor(Math.random() * 50 + 20)} tok/s` : 'Idle'}
            </span>
          </div>

          {/* Latency */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-retrieval-400" />
            <span className="text-historical-200 text-sm">{status.latency.toFixed(1)}ms</span>
          </div>

          {/* Context Usage */}
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-agents-400" />
            <span className="text-historical-200 text-sm">{Math.floor(status.contextUsage)} ctx</span>
          </div>
        </div>
      </div>
    </div>
  )
}
