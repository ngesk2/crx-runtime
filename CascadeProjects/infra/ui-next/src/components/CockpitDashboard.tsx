'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchSystemState, type SystemState } from '@/lib/gateway'
import {
  Activity, Database, Layers, Clock, TrendingUp, RefreshCw,
  Cpu, Zap, GitBranch, Target, Box, AlertTriangle
} from 'lucide-react'
import LiveOperations from './dashboard/LiveOperations'

const POLL_INTERVAL = 30000

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

/** Render a number honestly: digits when the backend sent one, "Unknown" otherwise. Never fabricated. */
function fmtNum(v: number | undefined | null): string {
  return typeof v === 'number' ? String(v) : 'Unknown'
}

/** Render a string honestly: the value when present and non-empty, "Unknown" otherwise. */
function fmtStr(v: string | undefined | null): string {
  return typeof v === 'string' && v.length > 0 ? v : 'Unknown'
}

function fmtUptime(seconds: number | undefined | null): string {
  if (typeof seconds !== 'number') return 'Unknown'
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds)}s`
}

/**
 * Map a backend section status ('available' | 'unavailable') to a display
 * label + dot. A missing section is Unknown, never assumed healthy.
 */
function sectionStatus(status: string | undefined): { label: string; dot?: string } {
  if (status === 'available') return { label: 'Connected', dot: 'healthy' }
  if (status === 'unavailable') return { label: 'Unavailable', dot: 'unhealthy' }
  return { label: 'Unknown' }
}

/** Body for a panel whose keys the backend does not return. */
function NotReported() {
  return (
    <>
      <StatRow label="State" value="Unknown" />
      <p className="text-xs text-historical-500 mt-1">Not reported by the gateway.</p>
    </>
  )
}

export default function CockpitDashboard() {
  const [state, setState] = useState<SystemState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchState = useCallback(async () => {
    try {
      const data = await fetchSystemState()
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
  const pg = sectionStatus(s.postgres?.status)
  const qd = sectionStatus(s.qdrant?.status)
  const rp = sectionStatus(s.replay?.status)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-historical-100">Constitutional Operations Cockpit</h1>
          <p className="text-xs text-historical-500 mt-1">
            Gateway{s.version ? ` v${s.version}` : ''} · {lastUpdate ? `Last updated ${lastUpdate}` : ''}
            {' '}· <span className="text-historical-400">{fmtNum(s.repository?.total_nodes)} nodes · {fmtNum(s.repository?.total_edges)} edges</span>
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

      {/* Live operations: real system state, honest unavailable states */}
      <LiveOperations />

      {/* Constitutional Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

        {/* 1. Repository */}
        <Panel title="Repository" icon={<Box className="w-4 h-4" />}>
          <StatRow label="Total Nodes" value={fmtNum(s.repository?.total_nodes)} />
          <StatRow label="Total Edges" value={fmtNum(s.repository?.total_edges)} />
          <StatRow label="Intents" value={fmtNum(s.repository?.intents)} />
          <StatRow label="Authorities" value={fmtNum(s.repository?.authorities)} />
          <StatRow label="Capabilities" value={fmtNum(s.repository?.capabilities)} />
          <StatRow label="Specifications" value={fmtNum(s.repository?.specifications)} />
          <StatRow label="Duplicate Warnings" value={fmtNum(s.repository?.duplicate_warnings)} />
        </Panel>

        {/* 2. PostgreSQL Status */}
        <Panel title="PostgreSQL" icon={<Database className="w-4 h-4" />}>
          <StatRow label="Status" value={pg.label} status={pg.dot} />
          <StatRow label="Total Events" value={fmtNum(s.postgres?.total_events)} />
          <StatRow label="Streams" value={fmtNum(s.postgres?.streams)} />
          <StatRow label="Event Types" value={fmtNum(s.postgres?.event_types)} />
        </Panel>

        {/* 3. Qdrant Status */}
        <Panel title="Qdrant" icon={<Layers className="w-4 h-4" />}>
          <StatRow label="Status" value={qd.label} status={qd.dot} />
          <StatRow label="Collections" value={fmtNum(s.qdrant?.collections)} />
          <StatRow label="Total Points" value={fmtNum(s.qdrant?.total_points)} />
          <StatRow label="Total Vectors" value={fmtNum(s.qdrant?.total_vectors)} />
        </Panel>

        {/* 4. Lifecycle Status — backend does not report lifecycle keys */}
        <Panel title="Lifecycles" icon={<Clock className="w-4 h-4" />}>
          <NotReported />
        </Panel>

        {/* 5. System Health */}
        <Panel title="System Health" icon={<Activity className="w-4 h-4" />}>
          <StatRow label="Gateway" value="Healthy" status="healthy" />
          <StatRow label="PostgreSQL" value={pg.label} status={pg.dot} />
          <StatRow label="Qdrant" value={qd.label} status={qd.dot} />
          <StatRow label="Replay" value={rp.label} status={rp.dot} />
          <SectionTitle>Gateway Metrics</SectionTitle>
          <StatRow label="Uptime" value={fmtUptime(s.metrics?.uptime_seconds)} />
          <StatRow label="Total Requests" value={fmtNum(s.metrics?.total_requests)} />
        </Panel>

        {/* 6. Knowledge */}
        <Panel title="Knowledge" icon={<TrendingUp className="w-4 h-4" />}>
          <StatRow label="Knowledge Objects" value={fmtNum(s.knowledge?.knowledge_objects)} />
          <StatRow label="Reflections" value={fmtNum(s.knowledge?.reflections)} />
          <StatRow label="Skills" value={fmtNum(s.knowledge?.skills)} />
          <StatRow label="Policies" value={fmtNum(s.knowledge?.policies)} />
          <StatRow label="Evidence" value={fmtNum(s.knowledge?.evidence)} />
          <StatRow label="Proofs" value={fmtNum(s.knowledge?.proofs)} />
          <StatRow label="Witnesses" value={fmtNum(s.knowledge?.witnesses)} />
          <StatRow label="Replay Certificates" value={fmtNum(s.knowledge?.replay_certificates)} />
          <StatRow label="Historical Snapshots" value={fmtNum(s.knowledge?.historical_snapshots)} />
        </Panel>

        {/* 7. Compiler Status — backend does not report compiler keys */}
        <Panel title="Compiler Status" icon={<Cpu className="w-4 h-4" />}>
          <NotReported />
        </Panel>

        {/* 8. Replay Status */}
        <Panel title="Replay Status" icon={<Zap className="w-4 h-4" />}>
          <StatRow label="Status" value={rp.label} status={rp.dot} />
          <StatRow label="Total Runs" value={fmtNum(s.replay?.total_runs)} />
          <StatRow label="Latest Replay" value={fmtStr(s.replay?.latest_replay)} />
        </Panel>

        {/* 9. Git Snapshot — backend returns an empty git object */}
        <Panel title="Git Snapshot" icon={<GitBranch className="w-4 h-4" />}>
          <NotReported />
        </Panel>

        {/* 10. Mission Queue */}
        <Panel title="Mission Queue" icon={<Target className="w-4 h-4" />}>
          <StatRow label="Queued" value={fmtNum(s.missions?.queued)} />
          <StatRow label="Executing" value={fmtNum(s.missions?.executing)} />
          <StatRow label="Completed" value={fmtNum(s.missions?.completed)} />
          <StatRow label="Failed" value={fmtNum(s.missions?.failed)} />
          <StatRow label="Blocked" value={fmtNum(s.missions?.blocked)} />
        </Panel>

      </div>
    </div>
  )
}
