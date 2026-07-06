'use client'

import { useState, useEffect } from 'react'

interface Category {
  name: string
  value: number
  max: number
  color: string
}

interface LivingRepositoryData {
  categories: Category[]
  most_active: string
}

const CATEGORY_ICONS: Record<string, string> = {
  Repository: 'R',
  Replay: 'P',
  Witness: 'W',
  Knowledge: 'K',
  Reflection: 'F',
  Patterns: 'P',
}

export default function LivingRepository() {
  const [data, setData] = useState<LivingRepositoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    fetch('/api/v1/repository/living')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && data) {
      const timer = setTimeout(() => setAnimated(true), 100)
      return () => clearTimeout(timer)
    }
  }, [loading, data])

  if (loading) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-historical-800 rounded" />
          <div className="flex items-end gap-4 h-48">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-1 bg-historical-800 rounded-t" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <p className="text-sm text-historical-500">Repository growth data unavailable</p>
      </div>
    )
  }

  const mostActive = data.most_active || data.categories.reduce((a, b) =>
    (a.value / a.max) > (b.value / b.max) ? a : b
  ).name

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
      <h2 className="text-lg font-semibold text-historical-100 mb-5">Living Repository</h2>

      <div className="flex items-end gap-3 h-56 px-2">
        {data.categories.map((cat, i) => {
          const pct = cat.max > 0 ? (cat.value / cat.max) * 100 : 0
          const isActive = cat.name === mostActive
          const icon = CATEGORY_ICONS[cat.name] || cat.name[0]

          return (
            <div key={cat.name} className="flex-1 flex flex-col items-center h-full justify-end">
              <div className="relative w-full flex flex-col items-center justify-end h-full">
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: cat.color }} />
                      <span className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: cat.color }} />
                    </span>
                  </div>
                )}
                <span className="text-xs font-mono text-historical-400 mb-1"
                  style={{
                    opacity: animated ? 1 : 0,
                    transition: `opacity 0.3s ease-out ${i * 0.1}s`,
                  }}>
                  {cat.value}
                </span>
                <div
                  className="w-full rounded-t-sm transition-all duration-1000 ease-out"
                  style={{
                    height: animated ? `${pct}%` : '0%',
                    backgroundColor: cat.color,
                    transitionDelay: `${i * 0.12}s`,
                    minHeight: pct > 0 ? '4px' : '0px',
                  }}
                />
              </div>
              <span className="text-xs text-historical-500 mt-2 truncate w-full text-center">{cat.name}</span>
              <span className="text-[10px] font-mono text-historical-600">{icon}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
