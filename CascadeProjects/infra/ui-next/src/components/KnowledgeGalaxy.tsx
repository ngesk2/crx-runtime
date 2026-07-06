'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { fetchJson } from '@/lib/gateway'

interface KGNode {
  id: string
  name: string
  type: 'Authority' | 'Capability' | 'Implementation'
  color: string
  confidence?: number
  authority?: string
  age?: number
  replay_verified?: boolean
  oss?: boolean
  local?: boolean
}

interface KGEdge {
  id: string
  source: string
  target: string
  label?: string
}

interface KGData {
  nodes: KGNode[]
  edges: KGEdge[]
}

type ColorMode = 'default' | 'confidence' | 'authority' | 'age' | 'replay_verified' | 'oss' | 'local'

const SIZES: Record<string, number> = { Authority: 28, Capability: 22, Implementation: 16 }
const TYPE_COLORS: Record<string, string> = { Authority: '#F59E0B', Capability: '#3B82F6', Implementation: '#22C55E' }

const COLOR_LABELS: Record<ColorMode, string> = {
  default: 'Default',
  confidence: 'Confidence',
  authority: 'Authority',
  age: 'Age',
  replay_verified: 'Replay Verified',
  oss: 'OSS',
  local: 'Local',
}

function nodeSize(type: string): number {
  return SIZES[type] || 16
}

function nodeColor(node: KGNode, mode: ColorMode): string {
  switch (mode) {
    case 'default':
      return node.color || TYPE_COLORS[node.type] || '#6B7280'
    case 'confidence': {
      const c = node.confidence ?? 0.5
      return c >= 0.8 ? '#22C55E' : c >= 0.5 ? '#F59E0B' : '#EF4444'
    }
    case 'authority': {
      const a = (node.authority || '').toLowerCase()
      if (a.includes('constitutional')) return '#F59E0B'
      if (a.includes('runtime')) return '#3B82F6'
      if (a.includes('learning')) return '#22C55E'
      if (a.includes('observability')) return '#06B6D4'
      if (a.includes('retrieval')) return '#A855F7'
      return '#6B7280'
    }
    case 'age': {
      const a = Math.min(node.age ?? 50, 100) / 100
      const v = Math.round(100 + a * 155)
      const h = v.toString(16).padStart(2, '0')
      return `#${h}${h}${h}`
    }
    case 'replay_verified':
      return node.replay_verified ? '#22C55E' : '#6B7280'
    case 'oss':
      return node.oss ? '#3B82F6' : '#6B7280'
    case 'local':
      return node.local ? '#14B8A6' : '#6B7280'
  }
}

export default function KnowledgeGalaxy() {
  const [data, setData] = useState<KGData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [colorMode, setColorMode] = useState<ColorMode>('default')
  const [hoveredNode, setHoveredNode] = useState<{ name: string; type: string } | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchJson('/api/v1/knowledge-graph')
      setData(result)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch knowledge graph')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const positionedNodes = useMemo(() => {
    if (!data) return []
    const auth = data.nodes.filter(n => n.type === 'Authority')
    const cap = data.nodes.filter(n => n.type === 'Capability')
    const impl = data.nodes.filter(n => n.type === 'Implementation')
    const result: (KGNode & { x: number; y: number })[] = []
    const cx = 400, cy = 300

    auth.forEach((n, i) => {
      const a = (2 * Math.PI * i) / (auth.length || 1) - Math.PI / 2
      result.push({ ...n, x: cx + 80 * Math.cos(a), y: cy + 80 * Math.sin(a) })
    })
    cap.forEach((n, i) => {
      const a = (2 * Math.PI * i) / (cap.length || 1) - Math.PI / 2
      result.push({ ...n, x: cx + 200 * Math.cos(a), y: cy + 200 * Math.sin(a) })
    })
    impl.forEach((n, i) => {
      const a = (2 * Math.PI * i) / (impl.length || 1) - Math.PI / 2
      result.push({ ...n, x: cx + 320 * Math.cos(a), y: cy + 320 * Math.sin(a) })
    })
    return result
  }, [data])

  const nodeMap = useMemo(() => new Map(positionedNodes.map(n => [n.id, n])), [positionedNodes])

  const edges = useMemo(() => {
    if (!data) return []
    return data.edges.map(e => {
      const s = nodeMap.get(e.source), t = nodeMap.get(e.target)
      if (!s || !t) return null
      return { ...e, x1: s.x, y1: s.y, x2: t.x, y2: t.y }
    }).filter(Boolean) as (KGEdge & { x1: number; y1: number; x2: number; y2: number })[]
  }, [data, nodeMap])

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return positionedNodes
    return positionedNodes.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [positionedNodes, searchQuery])

  const stats = useMemo(() => {
    if (!data) return { totalNodes: 0, totalEdges: 0, authorityCount: 0, capabilityCount: 0 }
    return {
      totalNodes: data.nodes.length,
      totalEdges: data.edges.length,
      authorityCount: data.nodes.filter(n => n.type === 'Authority').length,
      capabilityCount: data.nodes.filter(n => n.type === 'Capability').length,
    }
  }, [data])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY < 0) setScale(s => Math.min(s + 0.1, 3))
    else setScale(s => Math.max(s - 0.1, 0.2))
  }, [])

  if (loading) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-historical-400">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
            </svg>
            <span>Loading knowledge graph...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="w-8 h-8 text-production-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <p className="text-historical-300 text-sm">Knowledge graph unavailable</p>
            <p className="text-historical-500 text-xs mt-1">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-runtime-600 text-white text-sm rounded-lg hover:bg-runtime-700">Retry</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-historical-700 bg-historical-800/50">
        <h3 className="text-sm font-semibold text-historical-200 uppercase tracking-wider mr-auto">Knowledge Galaxy</h3>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-historical-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text" placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-48 pl-8 pr-3 py-1.5 bg-historical-800 border border-historical-700 rounded-lg text-xs text-historical-200 placeholder-historical-500 focus:outline-none focus:border-runtime-500"
          />
        </div>
        <select
          value={colorMode}
          onChange={e => setColorMode(e.target.value as ColorMode)}
          className="bg-historical-800 border border-historical-700 rounded-lg text-xs text-historical-200 px-2 py-1.5 focus:outline-none focus:border-runtime-500"
        >
          {Object.entries(COLOR_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="p-1.5 bg-historical-800 hover:bg-historical-700 rounded-lg border border-historical-700 text-historical-400 hover:text-historical-200" title="Zoom in">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
            </svg>
          </button>
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.2))} className="p-1.5 bg-historical-800 hover:bg-historical-700 rounded-lg border border-historical-700 text-historical-400 hover:text-historical-200" title="Zoom out">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M8 12h8" />
            </svg>
          </button>
          <span className="text-xs text-historical-500 w-8 text-center">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      <div
        className="relative w-full h-[500px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onMouseDown={e => {
          setIsPanning(true)
          setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
        }}
        onMouseMove={e => {
          if (isPanning) setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
        }}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => { setIsPanning(false); setHoveredNode(null) }}
      >
        {filteredNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-historical-500 text-sm">
              {searchQuery ? 'No matching nodes found' : 'No nodes to display'}
            </p>
          </div>
        )}
        <div
          style={{
            transform: `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`,
            transformOrigin: 'center center',
            width: 800, height: 600,
            position: 'absolute',
            top: '50%', left: '50%',
            marginLeft: -400, marginTop: -300,
          }}
        >
          <svg width={800} height={600} className="overflow-visible">
            {edges.map(edge => (
              <line key={edge.id} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            ))}
            {filteredNodes.map(node => {
              const sz = nodeSize(node.type)
              const clr = nodeColor(node, colorMode)
              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode({ name: node.name, type: node.type })}
                  onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={node.x} cy={node.y} r={sz / 2} fill={clr} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={Math.max(6, sz * 0.3)} fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                    {node.name.substring(0, 2).toUpperCase()}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-6 px-4 py-2.5 border-t border-historical-700 bg-historical-800/30 text-xs">
        <span className="text-historical-400">
          Total: <strong className="text-historical-200">{stats.totalNodes}</strong> nodes,{' '}
          <strong className="text-historical-200">{stats.totalEdges}</strong> edges
        </span>
        <span className="text-historical-600">|</span>
        <span className="text-historical-400">
          <svg className="inline w-2.5 h-2.5 mr-1" viewBox="0 0 8 8" fill="#F59E0B"><circle cx="4" cy="4" r="4" /></svg>
          Authority: <strong className="text-historical-200">{stats.authorityCount}</strong>
        </span>
        <span className="text-historical-400">
          <svg className="inline w-2.5 h-2.5 mr-1" viewBox="0 0 8 8" fill="#3B82F6"><circle cx="4" cy="4" r="4" /></svg>
          Capability: <strong className="text-historical-200">{stats.capabilityCount}</strong>
        </span>
      </div>

      {hoveredNode && (
        <div
          className="fixed z-50 px-3 py-2 bg-historical-800 border border-historical-600 rounded-lg shadow-xl pointer-events-none text-xs"
          style={{ left: mousePos.x + 15, top: mousePos.y - 10, transform: 'translateY(-100%)' }}
        >
          <p className="font-semibold text-historical-100">{hoveredNode.name}</p>
          <p className="text-historical-400">{hoveredNode.type}</p>
        </div>
      )}
    </div>
  )
}
