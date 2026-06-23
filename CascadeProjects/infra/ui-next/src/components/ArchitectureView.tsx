'use client'

import { Monitor, Server, Database as DatabaseIcon, Cpu, ChevronDown } from 'lucide-react'

interface ArchitectureNode {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  icon: React.ReactNode
}

export default function ArchitectureView() {
  const nodes: ArchitectureNode[] = [
    {
      name: 'Next.js UI',
      status: 'healthy',
      icon: <Monitor className="w-5 h-5" />
    },
    {
      name: 'Gateway',
      status: 'healthy',
      icon: <Server className="w-5 h-5" />
    },
    {
      name: 'Ollama',
      status: 'healthy',
      icon: <DatabaseIcon className="w-5 h-5" />
    },
    {
      name: 'qwen3-coder',
      status: 'healthy',
      icon: <Cpu className="w-5 h-5" />
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-learning-400 bg-learning-400/10 border-learning-400/20'
      case 'unhealthy':
        return 'text-production-400 bg-production-400/10 border-production-400/20'
      default:
        return 'text-historical-400 bg-historical-400/10 border-historical-400/20'
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-historical-100">Architecture View</h2>
        <div className="flex items-center gap-2 text-observability-400">
          <div className="w-2 h-2 bg-observability-400 rounded-full animate-pulse" />
          <span className="text-sm">Live</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {nodes.map((node, index) => (
          <div key={node.name} className="w-full max-w-md">
            <div className={`
              flex items-center justify-between p-4 rounded-lg border
              ${getStatusColor(node.status)}
            `}>
              <div className="flex items-center gap-3">
                {node.icon}
                <span className="font-semibold text-historical-100">{node.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase font-medium ${getStatusColor(node.status).split(' ')[0]}`}>
                  {node.status}
                </span>
                {index < nodes.length - 1 && (
                  <ChevronDown className="w-4 h-4 text-historical-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-historical-800 rounded-lg p-4 border border-historical-700">
          <h3 className="text-historical-400 text-sm mb-3">Request Flow</h3>
          <div className="text-historical-300 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-runtime-400 rounded-full" />
              <span>User → UI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-runtime-400 rounded-full" />
              <span>UI → Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-runtime-400 rounded-full" />
              <span>Gateway → Ollama</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-runtime-400 rounded-full" />
              <span>Ollama → Model</span>
            </div>
          </div>
        </div>

        <div className="bg-historical-800 rounded-lg p-4 border border-historical-700">
          <h3 className="text-historical-400 text-sm mb-3">Response Flow</h3>
          <div className="text-historical-300 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-observability-400 rounded-full" />
              <span>Model → Ollama</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-observability-400 rounded-full" />
              <span>Ollama → Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-observability-400 rounded-full" />
              <span>Gateway → UI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-observability-400 rounded-full" />
              <span>UI → User</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
