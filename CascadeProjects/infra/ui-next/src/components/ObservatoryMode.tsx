'use client'

import { Activity, Clock, Database, Zap, TrendingUp, Network } from 'lucide-react'

export default function ObservatoryMode() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-historical-100">Observatory Mode</h2>
        <div className="flex items-center gap-2 text-observability-400">
          <div className="w-2 h-2 bg-observability-400 rounded-full animate-pulse" />
          <span className="text-sm">Live</span>
        </div>
      </div>

      {/* Runtime Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-historical-800 rounded-lg p-4 border border-historical-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-historical-400 text-sm">Gateway Health</span>
            <Activity className="w-4 h-4 text-learning-400" />
          </div>
          <div className="text-2xl font-bold text-learning-400">Healthy</div>
          <div className="text-xs text-historical-500 mt-1">99.9% uptime</div>
        </div>

        <div className="bg-historical-800 rounded-lg p-4 border border-historical-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-historical-400 text-sm">Ollama Status</span>
            <Database className="w-4 h-4 text-learning-400" />
          </div>
          <div className="text-2xl font-bold text-learning-400">Connected</div>
          <div className="text-xs text-historical-500 mt-1">qwen3-coder loaded</div>
        </div>

        <div className="bg-historical-800 rounded-lg p-4 border border-historical-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-historical-400 text-sm">Network Status</span>
            <Network className="w-4 h-4 text-learning-400" />
          </div>
          <div className="text-2xl font-bold text-learning-400">Optimal</div>
          <div className="text-xs text-historical-500 mt-1">0.2ms latency</div>
        </div>
      </div>

      {/* Latency & Throughput */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-historical-800 rounded-lg p-4 border border-historical-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-historical-400 text-sm">Latency Distribution</span>
            <Clock className="w-4 h-4 text-observability-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-historical-300 text-sm">P50</span>
              <span className="text-historical-100 font-mono">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-historical-300 text-sm">P95</span>
              <span className="text-historical-100 font-mono">120ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-historical-300 text-sm">P99</span>
              <span className="text-historical-100 font-mono">280ms</span>
            </div>
          </div>
        </div>

        <div className="bg-historical-800 rounded-lg p-4 border border-historical-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-historical-400 text-sm">Throughput</span>
            <TrendingUp className="w-4 h-4 text-observability-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-historical-300 text-sm">Requests/min</span>
              <span className="text-historical-100 font-mono">24</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-historical-300 text-sm">Tokens/sec</span>
              <span className="text-historical-100 font-mono">42</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-historical-300 text-sm">Avg Response</span>
              <span className="text-historical-100 font-mono">1.2s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Activity */}
      <div className="bg-historical-800 rounded-lg p-4 border border-historical-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-historical-400 text-sm">Stream Activity</span>
          <Zap className="w-4 h-4 text-constitutional-400" />
        </div>
        <div className="h-32 flex items-end gap-1">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-observability-500 rounded-t"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                opacity: Math.random() * 0.5 + 0.5
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
