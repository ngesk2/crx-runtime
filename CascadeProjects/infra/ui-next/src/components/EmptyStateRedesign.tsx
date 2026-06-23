'use client'

import { Cpu, Network, Activity, FileText, Bug, Layers, FileSearch, ScrollText } from 'lucide-react'

interface ActionItem {
  icon: React.ReactNode
  label: string
  description: string
}

export default function EmptyStateRedesign() {
  const actions: ActionItem[] = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Review Repository',
      description: 'Explore the codebase structure and architecture'
    },
    {
      icon: <Bug className="w-5 h-5" />,
      label: 'Debug Runtime',
      description: 'Investigate runtime issues and performance'
    },
    {
      icon: <Layers className="w-5 h-5" />,
      label: 'Analyze Architecture',
      description: 'Examine system components and dependencies'
    },
    {
      icon: <FileSearch className="w-5 h-5" />,
      label: 'Inspect Logs',
      description: 'Review system logs and error traces'
    },
    {
      icon: <ScrollText className="w-5 h-5" />,
      label: 'Run Audit',
      description: 'Execute constitutional and runtime audits'
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {/* CRX Identity */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-constitutional-500 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-historical-100">CRX Runtime</h1>
        </div>
        <p className="text-xl text-historical-300 mb-2">Local Sovereign Intelligence</p>
        <div className="flex items-center justify-center gap-6 text-sm text-historical-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-learning-400 rounded-full" />
            <span>Local</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-observability-400 rounded-full" />
            <span>Observable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-runtime-400 rounded-full" />
            <span>Deterministic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-constitutional-400 rounded-full" />
            <span>Auditable</span>
          </div>
        </div>
      </div>

      {/* Runtime Status */}
      <div className="bg-historical-800 rounded-lg p-6 border border-historical-700 mb-8 w-full max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-constitutional-400" />
            <div>
              <div className="text-xs text-historical-400">Model</div>
              <div className="text-historical-100 font-medium">qwen3-coder</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-runtime-400" />
            <div>
              <div className="text-xs text-historical-400">Gateway</div>
              <div className="text-learning-400 font-medium">Connected</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-observability-400" />
            <div>
              <div className="text-xs text-historical-400">Ollama</div>
              <div className="text-learning-400 font-medium">Ready</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-retrieval-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-historical-400">Status</div>
              <div className="text-learning-400 font-medium">Operational</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Actions */}
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-semibold text-historical-200 mb-4">Suggested Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              className="flex items-start gap-3 p-4 bg-historical-800 hover:bg-historical-750 border border-historical-700 rounded-lg transition-colors text-left"
            >
              <div className="text-runtime-400 mt-0.5">{action.icon}</div>
              <div>
                <div className="text-historical-200 font-medium mb-1">{action.label}</div>
                <div className="text-xs text-historical-400">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
