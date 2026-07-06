'use client'

import { useState, useEffect } from 'react'
import {
  GitBranch, Database, Brain, Search, Lightbulb, Target, RefreshCw,
  Shield, Activity, Clock, ArrowRight, CheckCircle, AlertTriangle,
  FileText, Layers, Award
} from 'lucide-react'

interface LifecycleStage {
  name: string
  icon: React.ReactNode
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  confidence: number
  latency?: number
  objectCount: number
  lastUpdate: string
}

interface ConstitutionalLifecycleProps {
  className?: string
}

export default function ConstitutionalLifecycle({ className = '' }: ConstitutionalLifecycleProps) {
  const [stages, setStages] = useState<LifecycleStage[]>([
    {
      name: 'Repository',
      icon: <GitBranch className="w-4 h-4" />,
      health: 'healthy',
      confidence: 1.0,
      objectCount: 1,
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Knowledge Objects',
      icon: <FileText className="w-4 h-4" />,
      health: 'healthy',
      confidence: 1.0,
      objectCount: 0,
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Embeddings',
      icon: <Brain className="w-4 h-4" />,
      health: 'healthy',
      confidence: 0.95,
      latency: 150,
      objectCount: 0,
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Qdrant',
      icon: <Database className="w-4 h-4" />,
      health: 'healthy',
      confidence: 1.0,
      objectCount: 0,
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Inference',
      icon: <Search className="w-4 h-4" />,
      health: 'healthy',
      confidence: 0.8,
      latency: 2000,
      objectCount: 0,
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Reflection',
      icon: <Lightbulb className="w-4 h-4" />,
      health: 'healthy',
      confidence: 0.75,
      objectCount: 0,
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Mission',
      icon: <Target className="w-4 h-4" />,
      health: 'healthy',
      confidence: 0.7,
      objectCount: 0,
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Replay',
      icon: <RefreshCw className="w-4 h-4" />,
      health: 'healthy',
      confidence: 1.0,
      objectCount: 0,
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Witness',
      icon: <Shield className="w-4 h-4" />,
      health: 'healthy',
      confidence: 1.0,
      objectCount: 0,
      lastUpdate: new Date().toISOString(),
    },
  ])

  const [selectedStage, setSelectedStage] = useState<number | null>(null)

  useEffect(() => {
    // Poll for lifecycle data
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/lifecycle')
        if (response.ok) {
          const data = await response.json()
          setStages(data.stages)
        }
      } catch (error) {
        console.error('Failed to fetch lifecycle data:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-learning-400 bg-learning-400/10'
      case 'degraded': return 'text-production-400 bg-production-400/10'
      case 'unhealthy': return 'text-production-500 bg-production-500/10'
      default: return 'text-historical-500 bg-historical-500/10'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-3 h-3" />
      case 'degraded': return <AlertTriangle className="w-3 h-3" />
      case 'unhealthy': return <AlertTriangle className="w-3 h-3" />
      default: return <Activity className="w-3 h-3" />
    }
  }

  const formatLatency = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return `${seconds}s ago`
  }

  return (
    <div className={`bg-historical-900 rounded-lg border border-historical-700 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-historical-700 bg-historical-800/50">
        <Award className="w-4 h-4 text-constitutional-400" />
        <h3 className="text-sm font-semibold text-historical-200 uppercase tracking-wider">
          Constitutional Lifecycle
        </h3>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2 overflow-x-auto pb-4">
          {stages.map((stage, index) => (
            <div key={stage.name} className="flex-shrink-0">
              <div
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-historical-500 ${
                  selectedStage === index
                    ? 'border-constitutional-400 bg-historical-800'
                    : 'border-historical-700 bg-historical-900'
                }`}
                onClick={() => setSelectedStage(selectedStage === index ? null : index)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-constitutional-400">{stage.icon}</span>
                  <span className="text-xs font-semibold text-historical-200">{stage.name}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs flex items-center gap-1 ${getHealthColor(stage.health)}`}>
                      {getHealthIcon(stage.health)}
                      {stage.health}
                    </span>
                    <span className="text-xs text-historical-400">
                      {stage.objectCount} objects
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-historical-500">Confidence</span>
                    <span className="text-xs font-mono text-historical-100">
                      {(stage.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {stage.latency && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-historical-500">Latency</span>
                      <span className="text-xs font-mono text-historical-100">
                        {formatLatency(stage.latency)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-historical-500">Updated</span>
                    <span className="text-xs text-historical-400">
                      {formatTime(stage.lastUpdate)}
                    </span>
                  </div>
                </div>
              </div>

              {index < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-historical-600 mx-1 mt-8" />
              )}
            </div>
          ))}
        </div>

        {selectedStage !== null && (
          <div className="mt-4 p-3 bg-historical-800 rounded-lg border border-historical-700">
            <h4 className="text-xs font-semibold text-historical-200 mb-2">
              {stages[selectedStage].name} Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-historical-500">Health</div>
              <div className={`text-historical-100 ${getHealthColor(stages[selectedStage].health)}`}>
                {stages[selectedStage].health}
              </div>
              <div className="text-historical-500">Confidence</div>
              <div className="text-historical-100 font-mono">
                {(stages[selectedStage].confidence * 100).toFixed(1)}%
              </div>
              <div className="text-historical-500">Object Count</div>
              <div className="text-historical-100 font-mono">
                {stages[selectedStage].objectCount}
              </div>
              <div className="text-historical-500">Last Update</div>
              <div className="text-historical-100">
                {formatTime(stages[selectedStage].lastUpdate)}
              </div>
              {stages[selectedStage].latency && (
                <>
                  <div className="text-historical-500">Latency</div>
                  <div className="text-historical-100 font-mono">
                    {formatLatency(stages[selectedStage].latency)}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
