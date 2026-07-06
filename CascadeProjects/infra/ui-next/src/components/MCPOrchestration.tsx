'use client'

import { useState, useEffect, useRef } from 'react'

interface Capability {
  id: string
  label: string
  authority: string
  replayable: boolean
  enabled: boolean
}

interface Provider {
  id: string
  name: string
  icon: string
  type: string
  enabled: boolean
  status: string
  connected: boolean
  latency: number
  authStatus: string
  lastEvent: any
  eventsProcessed: number
  capabilities: Capability[]
}

interface MCPEvent {
  id: string
  timestamp: string
  type: string
  provider: string
  source: string
  stage: string
  authority: string
  message: string
  replayable: boolean
}

interface CapabilityRow {
  capability: string
  label: string
  authority: string
  providers: string[]
  enabled: boolean
  replayable: boolean
}

interface QueueStats {
  queued: number
  running: number
  completed: number
  failed: number
  retrying: number
  blocked: number
}

interface ReplayEntry {
  id: string
  timestamp: string
  type: string
  provider: string
  authority: string
  message: string
  replayed: boolean
}

const STATUS_COLORS: Record<string, string> = {
  healthy: 'text-green-400 bg-green-400/10 border-green-500/30',
  disconnected: 'text-red-400 bg-red-400/10 border-red-500/30',
  disabled: 'text-gray-500 bg-gray-500/10 border-gray-500/30',
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
  warning: 'text-amber-400 bg-amber-400/10 border-amber-500/30',
}

const TYPE_COLORS: Record<string, string> = {
  core: 'border-purple-500/30',
  external: 'border-blue-500/30',
  local: 'border-green-500/30',
  inference: 'border-amber-500/30',
}

export default function MCPOrchestration() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [futureProviders, setFutureProviders] = useState<{name: string; icon: string}[]>([])
  const [events, setEvents] = useState<MCPEvent[]>([])
  const [matrix, setMatrix] = useState<CapabilityRow[]>([])
  const [queue, setQueue] = useState<QueueStats | null>(null)
  const [replay, setReplay] = useState<ReplayEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('providers')
  const eventsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAll = () => {
      Promise.all([
        fetch('/api/v1/mcp/providers').then(r => r.json()),
        fetch('/api/v1/mcp/events?limit=50').then(r => r.json()),
        fetch('/api/v1/mcp/capability-matrix').then(r => r.json()),
        fetch('/api/v1/mcp/queue').then(r => r.json()),
        fetch('/api/v1/mcp/replay').then(r => r.json()),
      ])
        .then(([p, e, m, q, r]) => {
          setProviders(p.providers || [])
          setFutureProviders(p.future || [])
          setEvents(e.events || [])
          setMatrix(m.matrix || [])
          setQueue(q.queue || null)
          setReplay(r.replay || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
    fetchAll()
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  const toggleProvider = (name: string, enabled: boolean) => {
    const endpoint = enabled ? 'resume' : 'pause'
    fetch(`/api/v1/mcp/providers/${name}/${endpoint}`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'ok') {
          setProviders(prev => prev.map(p =>
            p.id === name ? { ...p, enabled: d.enabled, capabilities: p.capabilities.map(c => ({ ...c, enabled: d.enabled })) } : p
          ))
        }
      })
  }

  const reconnectProvider = (name: string) => {
    fetch(`/api/v1/mcp/providers/${name}/reconnect`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'ok') {
          setProviders(prev => prev.map(p =>
            p.id === name ? { ...p, connected: true, status: 'healthy' } : p
          ))
        }
      })
  }

  if (loading) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-56 bg-historical-800 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-historical-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'providers', label: 'Providers', count: providers.length },
    { id: 'capabilities', label: 'Capabilities', count: matrix.length },
    { id: 'events', label: 'Events', count: events.length },
    { id: 'queue', label: 'Queue' },
    { id: 'replay', label: 'Replay', count: replay.length },
  ]

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-historical-100">MCP Orchestration</h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${providers.some(p => p.status === 'disconnected') ? 'bg-red-400' : providers.every(p => p.status === 'healthy') ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-xs text-historical-500">
            {providers.filter(p => p.connected).length}/{providers.length} connected
          </span>
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-historical-700 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-constitutional-500/20 text-constitutional-300 border border-constitutional-500/30'
                : 'text-historical-500 hover:text-historical-300 hover:bg-historical-800/50'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-historical-800 text-historical-500 text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {providers.map(provider => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onToggle={toggleProvider}
                onReconnect={reconnectProvider}
              />
            ))}
          </div>
          {futureProviders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-historical-400 mb-3">Future Providers</h3>
              <div className="flex flex-wrap gap-2">
                {futureProviders.map(fp => (
                  <div key={fp.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-historical-800/30 rounded-lg border border-dashed border-historical-700/50 text-historical-500 text-xs">
                    <span>{fp.icon}</span>
                    <span>{fp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'capabilities' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-historical-700">
                <th className="text-left py-2 pr-4 text-historical-400 font-medium">Capability</th>
                <th className="text-left py-2 pr-4 text-historical-400 font-medium">Authority</th>
                <th className="text-left py-2 pr-4 text-historical-400 font-medium">Providers</th>
                <th className="text-center py-2 pr-4 text-historical-400 font-medium">Enabled</th>
                <th className="text-center py-2 text-historical-400 font-medium">Replayable</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map(row => (
                <tr key={row.capability} className="border-b border-historical-700/50 hover:bg-historical-800/30">
                  <td className="py-2 pr-4 text-historical-200 font-mono">{row.label}</td>
                  <td className="py-2 pr-4">
                    <span className="px-2 py-0.5 rounded bg-constitutional-500/10 text-constitutional-400 border border-constitutional-500/20 text-[10px]">
                      {row.authority}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-historical-400">{row.providers.join(', ')}</td>
                  <td className="py-2 pr-4 text-center">
                    <span className={`text-xs ${row.enabled ? 'text-green-400' : 'text-red-400'}`}>
                      {row.enabled ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className={`text-xs ${row.replayable ? 'text-blue-400' : 'text-historical-600'}`}>
                      {row.replayable ? '✓' : '✗'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {events.slice().reverse().map(event => (
              <div key={event.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-historical-800/30 text-xs">
                <span className="text-historical-500 font-mono shrink-0 w-16">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className={`shrink-0 w-5 text-center ${
                  event.type === 'completed' ? 'text-green-400' :
                  event.type === 'failed' ? 'text-red-400' :
                  event.type === 'running' ? 'text-blue-400' :
                  'text-historical-500'
                }`}>
                  {event.type === 'completed' ? '✓' :
                   event.type === 'failed' ? '✗' :
                   event.type === 'running' ? '→' :
                   event.type === 'queued' ? '○' : '·'}
                </span>
                <span className="text-historical-400 shrink-0">{event.provider}</span>
                {event.stage && (
                  <span className="text-constitutional-400 shrink-0">[{event.stage}]</span>
                )}
                <span className="text-historical-300 truncate">{event.message}</span>
              </div>
            ))}
            <div ref={eventsEndRef} />
          </div>
          {events.length === 0 && (
            <div className="text-center py-8 text-historical-500 text-sm">No events yet</div>
          )}
        </div>
      )}

      {activeTab === 'queue' && (
        <div>
          <div className="grid grid-cols-6 gap-3 mb-6">
            {queue && ([
              { key: 'queued', label: 'Queued', color: 'text-yellow-400' },
              { key: 'running', label: 'Running', color: 'text-blue-400' },
              { key: 'completed', label: 'Completed', color: 'text-green-400' },
              { key: 'failed', label: 'Failed', color: 'text-red-400' },
              { key: 'retrying', label: 'Retrying', color: 'text-amber-400' },
              { key: 'blocked', label: 'Blocked', color: 'text-gray-400' },
            ]).map(stat => (
              <div key={stat.key} className="bg-historical-800/40 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{queue[stat.key as keyof QueueStats] ?? 0}</div>
                <div className="text-xs text-historical-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-medium text-historical-300 mb-3">Per Provider</h3>
          <div className="space-y-2">
            {providers.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 bg-historical-800/30 rounded-lg">
                <span className="text-sm">{p.icon}</span>
                <span className="text-sm text-historical-200 w-24">{p.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  p.status === 'healthy' ? 'bg-green-400/10 text-green-400' :
                  p.status === 'disconnected' ? 'bg-red-400/10 text-red-400' :
                  'bg-yellow-400/10 text-yellow-400'
                }`}>{p.status}</span>
                <span className="text-xs text-historical-500">{p.eventsProcessed} events</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'replay' && (
        <div>
          <p className="text-xs text-historical-500 mb-4">Read-only replay queue — never mutates replay state</p>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              {replay.slice().reverse().map(entry => (
                <div key={entry.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-historical-800/30 text-xs">
                  <span className="text-historical-500 font-mono shrink-0 w-16">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-constitutional-400 shrink-0">[{entry.authority}]</span>
                  <span className="text-historical-400 shrink-0">{entry.provider}</span>
                  <span className="text-historical-300 truncate">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
          {replay.length === 0 && (
            <div className="text-center py-8 text-historical-500 text-sm">No replay entries</div>
          )}
        </div>
      )}
    </div>
  )
}

function ProviderCard({
  provider,
  onToggle,
  onReconnect,
}: {
  provider: Provider
  onToggle: (name: string, enabled: boolean) => void
  onReconnect: (name: string) => void
}) {
  const capsEnabled = provider.capabilities.filter(c => c.enabled).length
  const capsTotal = provider.capabilities.length

  return (
    <div className={`bg-historical-800/30 rounded-lg border p-4 ${TYPE_COLORS[provider.type] || 'border-historical-700'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{provider.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-historical-100">{provider.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[provider.status] || STATUS_COLORS.pending}`}>
                {provider.status}
              </span>
            </div>
            <div className="text-[10px] text-historical-500 mt-0.5">{provider.type}</div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={provider.enabled}
            onChange={() => onToggle(provider.id, provider.enabled)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-historical-700 rounded-full peer peer-checked:bg-constitutional-500/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <div className="text-historical-500">Latency</div>
          <div className="text-historical-200 font-mono">{provider.latency > 0 ? `${provider.latency}ms` : '—'}</div>
        </div>
        <div>
          <div className="text-historical-500">Auth</div>
          <div className="text-historical-200">{provider.authStatus}</div>
        </div>
        <div>
          <div className="text-historical-500">Events</div>
          <div className="text-historical-200">{provider.eventsProcessed}</div>
        </div>
        <div>
          <div className="text-historical-500">Capabilities</div>
          <div className="text-historical-200">{capsEnabled}/{capsTotal}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {provider.capabilities.slice(0, 4).map(cap => (
          <span
            key={cap.id}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              cap.enabled
                ? 'bg-constitutional-500/10 text-constitutional-400 border border-constitutional-500/20'
                : 'bg-historical-700/50 text-historical-500 border border-historical-600/30'
            }`}
          >
            {cap.label}
          </span>
        ))}
        {capsTotal > 4 && (
          <span className="text-[10px] text-historical-500 px-1.5 py-0.5">+{capsTotal - 4}</span>
        )}
      </div>

      <div className="flex gap-2">
        {provider.connected && (
          <span className="text-[10px] text-green-400/70 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Connected
          </span>
        )}
        {!provider.connected && provider.enabled && (
          <button
            onClick={() => onReconnect(provider.id)}
            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reconnect
          </button>
        )}
        <button className="text-[10px] text-historical-500 hover:text-historical-300 ml-auto flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Logs
        </button>
      </div>
    </div>
  )
}
