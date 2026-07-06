'use client'

import { useState, useEffect } from 'react'

interface PatternFinding {
  pattern: string
  count: number
  last_seen: string
  suggested_repair: string
}

interface CollectionInfo {
  name: string
  points: number
}

interface MemorySummary {
  status: string
  stats: {
    objects: number
    reflections: number
    skills: number
    patterns: number
    witnesses: number
    embeddings: number
    growth_today: number
  }
  patterns: PatternFinding[]
  collections: CollectionInfo[]
}

export default function SemanticMemory() {
  const [data, setData] = useState<MemorySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/memory/summary')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-historical-800 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-historical-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.status === 'unavailable') {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="flex items-center gap-3 text-amber-400">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Qdrant not connected</span>
        </div>
      </div>
    )
  }

  const maxPoints = Math.max(...data.collections.map(c => c.points), 1)
  const { stats } = data

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
      <h2 className="text-lg font-semibold text-historical-100 mb-5">Semantic Memory</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatBox label="Objects" value={stats.objects} />
        <StatBox label="Reflections" value={stats.reflections} />
        <StatBox label="Skills" value={stats.skills} />
        <StatBox label="Patterns" value={stats.patterns} />
        <StatBox label="Witnesses" value={stats.witnesses} />
        <StatBox label="Embeddings" value={stats.embeddings} />
      </div>

      {stats.growth_today > 0 && (
        <div className="flex items-center gap-2 mb-6 px-4 py-2 bg-historical-800/50 rounded-lg">
          <span className="text-sm text-historical-400">Growth today</span>
          <span className="text-sm font-mono text-green-400">+{stats.growth_today}</span>
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      )}

      {data.collections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-historical-300 mb-3">Collections</h3>
          <div className="space-y-2">
            {data.collections.map(col => (
              <div key={col.name} className="flex items-center gap-3">
                <span className="text-sm text-historical-400 w-40 truncate">{col.name}</span>
                <div className="flex-1 h-4 bg-historical-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-constitutional-500 rounded-full transition-all duration-500"
                    style={{ width: `${(col.points / maxPoints) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-historical-500 w-16 text-right">{col.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.patterns.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-historical-300 mb-3">Patterns</h3>
          <div className="space-y-2">
            {data.patterns.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-historical-800/30 rounded-lg border border-historical-700/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-historical-200">{p.pattern}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-historical-700 text-historical-400 font-mono">{p.count}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-historical-500">
                    <span>Last seen: {p.last_seen}</span>
                    <span className="text-amber-500/70">{p.suggested_repair}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-historical-800/40 rounded-lg p-3">
      <div className="text-2xl font-bold text-historical-100">{value.toLocaleString()}</div>
      <div className="text-xs text-historical-500 mt-0.5">{label}</div>
    </div>
  )
}
