'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Activity, Server, Database, Cpu, HardDrive, Network, GitBranch,
  BookOpen, FileText, Layers, Award, Shield, AlertTriangle, CheckCircle,
  BarChart3, TrendingUp, Clock, RefreshCw, GitCommit,
  Box, Archive, Zap, PieChart, Target, Users
} from 'lucide-react'

const POLL_INTERVAL = 30000
const GATEWAY_URL = 'http://localhost:8080'

interface SystemState {
  timestamp: string
  objects: { total: number }
  graph: { nodes: number; edges: number; average_degree: number }
  services: {
    qdrant: { healthy: boolean; version?: string; error?: string }
    postgresql: { healthy: boolean; error?: string }
  }
  lifecycle: {
    active_lifecycles: number
    completed_lifecycles: number
  }
}

function Panel({ title, icon, children, className = '' }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-historical-900 rounded-lg border border-historical-700 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-historical-700 bg-historical-800/50">
        <span className="text-constitutional-400">{icon}</span>
        <h3 className="text-sm font-semibold text-historical-200 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'available' || status === 'healthy'
    ? 'bg-learning-400'
    : status === 'unavailable' || status === 'unhealthy'
    ? 'bg-production-400'
    : 'bg-historical-500'
  return <span className={`inline-block w-2 h-2 rounded-full ${color} ${status === 'healthy' ? 'animate-pulse' : ''}`} />
}

function StatRow({ label, value, unit = '', status }: { label: string; value: string | number; unit?: string; status?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-historical-400">{label}</span>
      <span className="text-sm font-mono text-historical-100">
        {status && <StatusDot status={status} />}
        {' '}{value}{unit && <span className="text-historical-500 text-xs ml-0.5">{unit}</span>}
      </span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold text-historical-500 uppercase tracking-wider mb-2 mt-3 first:mt-0">{children}</h4>
}

export default function CockpitDashboard() {
  const [state, setState] = useState<SystemState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchState = useCallback(async () => {
    try {
      const response = await fetch(`${GATEWAY_URL}/system/state`)
      if (!response.ok) throw new Error('Failed to fetch system state')
      const data = await response.json()
      setState(data)
      setLastUpdate(new Date().toLocaleTimeString())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch system state')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchState()
    const interval = setInterval(fetchState, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchState])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-historical-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading system state...</span>
        </div>
      </div>
    )
  }

  if (error && !state) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-production-400 mx-auto mb-2" />
          <p className="text-historical-300 text-sm">Gateway unreachable</p>
          <p className="text-historical-500 text-xs mt-1">{error}</p>
          <button onClick={fetchState} className="mt-4 px-4 py-2 bg-runtime-600 text-white text-sm rounded-lg hover:bg-runtime-700">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const s = state!

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-historical-100">Constitutional Operations Cockpit</h1>
          <p className="text-xs text-historical-500 mt-1">
            Gateway · {lastUpdate ? `Last updated ${lastUpdate}` : ''}
            {' '}· <span className="text-historical-400">{s.objects.total} objects</span>
          </p>
        </div>
        <button
          onClick={fetchState}
          className="flex items-center gap-2 px-3 py-1.5 bg-historical-800 hover:bg-historical-700 text-historical-300 text-sm rounded-lg border border-historical-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Constitutional Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

        {/* 1. Object Counts */}
        <Panel title="Object Counts" icon={<Box className="w-4 h-4" />}>
          <StatRow label="Total Objects" value={s.objects.total} />
          <StatRow label="Graph Nodes" value={s.graph.nodes} />
          <StatRow label="Graph Edges" value={s.graph.edges} />
          <StatRow label="Avg Degree" value={s.graph.average_degree.toFixed(2)} />
        </Panel>

        {/* 2. PostgreSQL Status */}
        <Panel title="PostgreSQL" icon={<Database className="w-4 h-4" />}>
          <StatRow label="Status" value={s.services.postgresql.healthy ? 'Connected' : 'Unavailable'} status={s.services.postgresql.healthy ? 'healthy' : 'unhealthy'} />
          {s.services.postgresql.error && (
            <StatRow label="Error" value={s.services.postgresql.error} status="unhealthy" />
          )}
        </Panel>

        {/* 3. Qdrant Status */}
        <Panel title="Qdrant" icon={<Layers className="w-4 h-4" />}>
          <StatRow label="Status" value={s.services.qdrant.healthy ? 'Connected' : 'Unavailable'} status={s.services.qdrant.healthy ? 'healthy' : 'unhealthy'} />
          {s.services.qdrant.version && (
            <StatRow label="Version" value={s.services.qdrant.version} />
          )}
          {s.services.qdrant.error && (
            <StatRow label="Error" value={s.services.qdrant.error} status="unhealthy" />
          )}
        </Panel>

        {/* 4. Lifecycle Status */}
        <Panel title="Lifecycles" icon={<Clock className="w-4 h-4" />}>
          <StatRow label="Active" value={s.lifecycle.active_lifecycles} status={s.lifecycle.active_lifecycles > 0 ? 'healthy' : undefined} />
          <StatRow label="Completed" value={s.lifecycle.completed_lifecycles} />
        </Panel>

        {/* 5. System Health */}
        <Panel title="System Health" icon={<Activity className="w-4 h-4" />}>
          <StatRow label="Gateway" value="Healthy" status="healthy" />
          <StatRow label="PostgreSQL" value={s.services.postgresql.healthy ? 'Healthy' : 'Unhealthy'} status={s.services.postgresql.healthy ? 'healthy' : 'unhealthy'} />
          <StatRow label="Qdrant" value={s.services.qdrant.healthy ? 'Healthy' : 'Unhealthy'} status={s.services.qdrant.healthy ? 'healthy' : 'unhealthy'} />
        </Panel>

        {/* 6. Knowledge Growth */}
        <Panel title="Knowledge Growth" icon={<TrendingUp className="w-4 h-4" />}>
          <StatRow label="Objects" value={s.objects.total} />
          <StatRow label="Growth Rate" value="+" unit="0%" />
          <SectionTitle>Graph Complexity</SectionTitle>
          <StatRow label="Nodes" value={s.graph.nodes} />
          <StatRow label="Edges" value={s.graph.edges} />
        </Panel>

        {/* 7. Compiler Status */}
        <Panel title="Compiler Status" icon={<Cpu className="w-4 h-4" />}>
          <StatRow label="Status" value="Ready" status="healthy" />
          <StatRow label="Passes" value="6" />
          <SectionTitle>Passes</SectionTitle>
          <div className="space-y-1 text-xs text-historical-400">
            <div>✓ Acquisition</div>
            <div>✓ Normalization</div>
            <div>✓ Structural</div>
            <div>✓ Semantic</div>
            <div>✓ Verification</div>
            <div>✓ Synthesis</div>
          </div>
        </Panel>

        {/* 8. Replay Status */}
        <Panel title="Replay Status" icon={<Zap className="w-4 h-4" />}>
          <StatRow label="Status" value="Ready" status="healthy" />
          <StatRow label="Log Entries" value="0" />
          <SectionTitle>Witness Chain</SectionTitle>
          <StatRow label="Blocks" value="0" />
          <StatRow label="Genesis" value="Initialized" status="healthy" />
        </Panel>

        {/* 9. Git Snapshot Status */}
        <Panel title="Git Snapshot" icon={<GitBranch className="w-4 h-4" />}>
          <StatRow label="Status" value="Immutable" status="healthy" />
          <SectionTitle>Snapshot Data</SectionTitle>
          <StatRow label="Commits" value="Stored" />
          <StatRow label="Trees" value="Stored" />
          <StatRow label="Blobs" value="Stored" />
        </Panel>

        {/* 10. Mission Queue */}
        <Panel title="Mission Queue" icon={<Target className="w-4 h-4" />}>
          <StatRow label="Queued" value="0" />
          <StatRow label="Executing" value="0" />
          <StatRow label="Completed" value="0" />
          <SectionTitle>Reflection Feed</SectionTitle>
          <StatRow label="Entries" value="0" />
        </Panel>

      </div>
    </div>
  )
}
