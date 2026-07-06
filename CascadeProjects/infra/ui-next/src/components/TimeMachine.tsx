'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { fetchJson } from '@/lib/gateway'

interface TimelineSnapshot {
  date: string
  knowledge_objects: number
  replay_success_rate: number
  authority_drift: number
  mission_throughput: number
}

interface TimelineData {
  snapshots: TimelineSnapshot[]
  today?: TimelineSnapshot
  yesterday?: TimelineSnapshot
}

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (current > previous) {
    return (
      <span className="text-learning-400 inline-flex items-center">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </span>
    )
  }
  if (current < previous) {
    return (
      <span className="text-production-400 inline-flex items-center">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    )
  }
  return <span className="text-historical-500">—</span>
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TimeMachine() {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const timelineRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchJson('/api/v1/timeline')
      setData(result)
      setSelectedIndex(result.snapshots ? result.snapshots.length - 1 : 0)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch timeline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!isPlaying || !data || data.snapshots.length === 0) return
    const interval = setInterval(() => {
      setSelectedIndex(prev => {
        if (prev >= data.snapshots.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [isPlaying, data])

  const updatePosition = useCallback((clientX: number) => {
    if (!timelineRef.current || !data || data.snapshots.length === 0) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const ratio = x / rect.width
    const index = Math.round(ratio * (data.snapshots.length - 1))
    setSelectedIndex(Math.max(0, Math.min(index, data.snapshots.length - 1)))
  }, [data])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    updatePosition(e.clientX)
  }, [updatePosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    updatePosition(e.clientX)
  }, [isDragging, updatePosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const currentSnapshot = useMemo(() => {
    if (!data || data.snapshots.length === 0) return null
    return data.snapshots[selectedIndex] || null
  }, [data, selectedIndex])

  const previousSnapshot = useMemo(() => {
    if (!data || selectedIndex <= 0) return null
    return data.snapshots[selectedIndex - 1] || null
  }, [data, selectedIndex])

  const comparisonData = useMemo(() => {
    if (!data) return null
    const today = data.today
    const yesterday = data.yesterday
    if (today && yesterday) return { today, yesterday }

    const snapshots = data.snapshots
    if (snapshots.length < 2) return null
    return {
      today: snapshots[snapshots.length - 1],
      yesterday: snapshots[snapshots.length - 2],
    }
  }, [data])

  const tickPositions = useMemo(() => {
    if (!data || data.snapshots.length === 0) return []
    const count = data.snapshots.length
    const step = Math.max(1, Math.floor(count / 6))
    const positions: { index: number; label: string; pos: number }[] = []
    for (let i = 0; i < count; i += step) {
      positions.push({ index: i, label: shortDate(data.snapshots[i].date), pos: (i / (count - 1)) * 100 })
    }
    if (positions[positions.length - 1]?.index !== count - 1) {
      positions.push({ index: count - 1, label: shortDate(data.snapshots[count - 1].date), pos: 100 })
    }
    return positions
  }, [data])

  if (loading) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-historical-400">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
            </svg>
            <span>Loading timeline...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <svg className="w-8 h-8 text-production-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <p className="text-historical-300 text-sm">Timeline unavailable</p>
            <p className="text-historical-500 text-xs mt-1">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-runtime-600 text-white text-sm rounded-lg hover:bg-runtime-700">Retry</button>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.snapshots.length === 0) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <svg className="w-10 h-10 text-historical-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p className="text-historical-300 text-sm font-medium">No historical snapshots found</p>
          <p className="text-historical-500 text-xs mt-1">Timeline data will appear once snapshots are created</p>
        </div>
      </div>
    )
  }

  const scrubberPos = (selectedIndex / (data.snapshots.length - 1)) * 100

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-historical-700 bg-historical-800/50">
        <h3 className="text-sm font-semibold text-historical-200 uppercase tracking-wider">Time Machine</h3>
        {currentSnapshot && (
          <span className="text-xs font-mono text-constitutional-400 font-semibold">{formatDate(currentSnapshot.date)}</span>
        )}
        <span className="text-xs text-historical-500 ml-auto">
          {selectedIndex + 1} / {data.snapshots.length} snapshots
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedIndex(i => Math.max(i - 1, 0))}
            disabled={selectedIndex === 0}
            className="p-1.5 bg-historical-800 hover:bg-historical-700 disabled:opacity-30 rounded-lg border border-historical-700 text-historical-400 hover:text-historical-200"
            title="Previous"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            className={`p-1.5 rounded-lg border border-historical-700 ${
              isPlaying
                ? 'bg-runtime-600 text-white hover:bg-runtime-700'
                : 'bg-historical-800 text-historical-400 hover:text-historical-200 hover:bg-historical-700'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setSelectedIndex(i => Math.min(i + 1, data.snapshots.length - 1))}
            disabled={selectedIndex === data.snapshots.length - 1}
            className="p-1.5 bg-historical-800 hover:bg-historical-700 disabled:opacity-30 rounded-lg border border-historical-700 text-historical-400 hover:text-historical-200"
            title="Next"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div
          ref={timelineRef}
          className="relative h-12 cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => isDragging && setIsDragging(false)}
        >
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-historical-700 rounded-full -translate-y-1/2" />

          {tickPositions.map(tick => (
            <div
              key={tick.index}
              className="absolute top-1/2 -translate-x-1/2"
              style={{ left: `${tick.pos}%` }}
            >
              <div className="w-px h-2.5 bg-historical-600 mx-auto" />
              <p className="text-2xs text-historical-500 mt-1 whitespace-nowrap">{tick.label}</p>
            </div>
          ))}

          <div
            className="absolute top-1/2 -translate-y-1/2 z-10"
            style={{ left: `${scrubberPos}%`, transform: `translate(-50%, -50%)` }}
            onMouseDown={e => { e.stopPropagation(); handleMouseDown(e) }}
          >
            <div className="w-3 h-3 bg-constitutional-400 rounded-full shadow-lg shadow-constitutional-400/30" />
            <div className="w-0.5 h-10 bg-constitutional-400/50 mx-auto -mt-1" />
          </div>

          <div className="absolute right-0 top-0 -translate-y-full px-2 py-0.5 bg-historical-800 rounded text-2xs text-historical-400 border border-historical-700">
            Today
          </div>
        </div>

        {currentSnapshot && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Knowledge Objects', value: currentSnapshot.knowledge_objects, prev: previousSnapshot?.knowledge_objects, format: (v: number) => v.toLocaleString() },
              { label: 'Replay Success Rate', value: currentSnapshot.replay_success_rate, prev: previousSnapshot?.replay_success_rate, format: (v: number) => `${v.toFixed(1)}%` },
              { label: 'Authority Drift', value: currentSnapshot.authority_drift, prev: previousSnapshot?.authority_drift, format: (v: number) => `${v.toFixed(2)}%` },
              { label: 'Mission Throughput', value: currentSnapshot.mission_throughput, prev: previousSnapshot?.mission_throughput, format: (v: number) => v.toFixed(1) },
            ].map(metric => (
              <div key={metric.label} className="bg-historical-800/50 rounded-lg border border-historical-700 p-3">
                <p className="text-2xs text-historical-500 uppercase tracking-wider mb-1">{metric.label}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-historical-100 font-mono">{metric.format(metric.value)}</span>
                  {metric.prev !== undefined && metric.prev !== null && (
                    <TrendArrow current={metric.value} previous={metric.prev} />
                  )}
                </div>
                {metric.prev !== undefined && metric.prev !== null && (
                  <p className="text-2xs text-historical-500 mt-0.5">
                    prev: {metric.format(metric.prev)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {comparisonData && (
          <div className="bg-historical-800/30 border border-historical-700 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-historical-400 uppercase tracking-wider mb-3">Yesterday vs Today</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-historical-400">Knowledge</span>
                <span className="text-historical-200 font-mono">
                  {comparisonData.yesterday.knowledge_objects.toLocaleString()}
                  <span className="text-historical-600 mx-1">→</span>
                  {comparisonData.today.knowledge_objects.toLocaleString()}
                  <span className="ml-1.5">
                    <TrendArrow current={comparisonData.today.knowledge_objects} previous={comparisonData.yesterday.knowledge_objects} />
                  </span>
                  <span className={`ml-1 ${comparisonData.today.knowledge_objects >= comparisonData.yesterday.knowledge_objects ? 'text-learning-400' : 'text-production-400'}`}>
                    {comparisonData.today.knowledge_objects - comparisonData.yesterday.knowledge_objects >= 0 ? '+' : ''}
                    {(comparisonData.today.knowledge_objects - comparisonData.yesterday.knowledge_objects).toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-historical-400">Replay Success</span>
                <span className="text-historical-200 font-mono">
                  {comparisonData.yesterday.replay_success_rate.toFixed(1)}%
                  <span className="text-historical-600 mx-1">→</span>
                  {comparisonData.today.replay_success_rate.toFixed(1)}%
                  <span className="ml-1.5">
                    <TrendArrow current={comparisonData.today.replay_success_rate} previous={comparisonData.yesterday.replay_success_rate} />
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-historical-400">Authority Drift</span>
                <span className="text-historical-200 font-mono">
                  {comparisonData.yesterday.authority_drift.toFixed(2)}%
                  <span className="text-historical-600 mx-1">→</span>
                  {comparisonData.today.authority_drift.toFixed(2)}%
                  <span className={`ml-1.5 ${comparisonData.today.authority_drift <= comparisonData.yesterday.authority_drift ? 'text-learning-400' : 'text-production-400'}`}>
                    {comparisonData.today.authority_drift > comparisonData.yesterday.authority_drift ? '+' : ''}
                    {(comparisonData.today.authority_drift - comparisonData.yesterday.authority_drift).toFixed(2)}%
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-historical-400">Mission Throughput</span>
                <span className="text-historical-200 font-mono">
                  {comparisonData.yesterday.mission_throughput.toFixed(1)}
                  <span className="text-historical-600 mx-1">→</span>
                  {comparisonData.today.mission_throughput.toFixed(1)}
                  <span className="ml-1.5">
                    <TrendArrow current={comparisonData.today.mission_throughput} previous={comparisonData.yesterday.mission_throughput} />
                  </span>
                  <span className={`ml-1 ${comparisonData.today.mission_throughput >= comparisonData.yesterday.mission_throughput ? 'text-learning-400' : 'text-production-400'}`}>
                    {comparisonData.today.mission_throughput >= comparisonData.yesterday.mission_throughput ? '+' : ''}
                    {((comparisonData.today.mission_throughput - comparisonData.yesterday.mission_throughput) / comparisonData.yesterday.mission_throughput * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
