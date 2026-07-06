'use client'

import { useState, useEffect } from 'react'

interface Metric {
  label: string
  value: number
  max: number
  trend: 'up' | 'down' | 'stable'
}

interface OrgHealth {
  score: number
  metrics: Metric[]
  overall_trend: 'up' | 'down' | 'stable'
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center text-green-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </span>
    )
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center text-red-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-gray-500">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      </svg>
    </span>
  )
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green-400'
  if (score >= 70) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreRingColor(score: number): string {
  if (score >= 90) return 'stroke-green-400'
  if (score >= 70) return 'stroke-yellow-400'
  return 'stroke-red-400'
}

function Gauge({ score }: { score: number }) {
  const r = 54
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center mb-6">
      <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="8"
          className="text-historical-800" />
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-1000 ease-out ${scoreRingColor(score)}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-historical-500">health score</span>
      </div>
    </div>
  )
}

export default function OrganizationalHealth() {
  const [data, setData] = useState<OrgHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/health/organizational')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-56 bg-historical-800 rounded" />
          <div className="w-32 h-32 mx-auto bg-historical-800 rounded-full" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-historical-800 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <p className="text-sm text-historical-500">Health data unavailable</p>
      </div>
    )
  }

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
      <h2 className="text-lg font-semibold text-historical-100 mb-4">Organizational Health</h2>

      <div className="relative flex justify-center items-center mb-2">
        <Gauge score={data.score} />
      </div>

      <div className="space-y-3">
        {data.metrics.map((m, i) => {
          const pct = m.max > 0 ? Math.round((m.value / m.max) * 100) : 0
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-historical-300">{m.label}</span>
                <span className="text-xs text-historical-500">
                  {m.value}{m.max > 0 ? `/${m.max}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-historical-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-constitutional-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <TrendIcon trend={m.trend} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-historical-700 flex items-center justify-between">
        <span className="text-xs text-historical-500">Overall trend</span>
        <span className="flex items-center gap-1 text-sm text-historical-300">
          {data.overall_trend === 'up' ? 'Improving' : data.overall_trend === 'down' ? 'Declining' : 'Stable'}
          <TrendIcon trend={data.overall_trend} />
        </span>
      </div>
    </div>
  )
}
