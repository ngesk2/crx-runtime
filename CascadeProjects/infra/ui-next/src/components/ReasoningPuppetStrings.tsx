'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface Weights {
  novelty: number
  risk: number
  technical_debt: number
  confidence_threshold: number
  replay_importance: number
  authority_depth: number
  witness_quality: number
}

interface WeightConfig {
  key: keyof Weights
  label: string
  description: string
  color: string
}

const DEFAULT_WEIGHTS: Weights = {
  novelty: 0.5,
  risk: 0.3,
  technical_debt: 0.4,
  confidence_threshold: 0.6,
  replay_importance: 0.7,
  authority_depth: 0.5,
  witness_quality: 0.6,
}

const WEIGHT_CONFIGS: WeightConfig[] = [
  { key: 'novelty', label: 'Novelty', description: 'Preference for unexplored solutions', color: '#7C3AED' },
  { key: 'risk', label: 'Risk', description: 'Tolerance for potentially unstable operations', color: '#DC2626' },
  { key: 'technical_debt', label: 'Technical Debt', description: 'Priority on cleanup vs. new features', color: '#F97316' },
  { key: 'confidence_threshold', label: 'Confidence Threshold', description: 'Minimum confidence to approve mission', color: '#2563EB' },
  { key: 'replay_importance', label: 'Replay Importance', description: 'Weight of replay safety in planning', color: '#059669' },
  { key: 'authority_depth', label: 'Authority Depth', description: 'How deep to traverse authority chains', color: '#D97706' },
  { key: 'witness_quality', label: 'Witness Quality', description: 'Required witness certificate quality', color: '#0891B2' },
]

function SliderRow({
  config,
  value,
  onChange,
}: {
  config: WeightConfig
  value: number
  onChange: (key: keyof Weights, value: number) => void
}) {
  const [localValue, setLocalValue] = useState(value)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const percent = localValue * 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm font-medium text-historical-200">{config.label}</span>
        </div>
        <span className="text-sm tabular-nums text-historical-400 font-mono">{localValue.toFixed(2)}</span>
      </div>

      <div className="relative">
        {/* Threshold marker at 0.5 */}
        <div
          className="absolute top-0 bottom-0 w-px bg-historical-500/40 z-10"
          style={{ left: '50%' }}
        />
        <div
          className="absolute top-0 bottom-0 flex items-center"
          style={{ left: '50%' }}
        >
          <span className="text-[10px] text-historical-600 -ml-3 mt-5">0.5</span>
        </div>

        <div
          ref={trackRef}
          className="relative h-2 bg-historical-800 rounded-full cursor-pointer overflow-hidden"
          onClick={(e) => {
            if (!trackRef.current) return
            const rect = trackRef.current.getBoundingClientRect()
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            setLocalValue(Math.round(x * 100) / 100)
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, ${config.color}44, ${config.color}88)`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 shadow-sm transition-all duration-75"
            style={{
              left: `calc(${percent}% - 7px)`,
              backgroundColor: config.color,
              borderColor: config.color,
            }}
          />
        </div>
      </div>

      <p className="text-xs text-historical-500 pl-5">{config.description}</p>
    </div>
  )
}

export default function ReasoningPuppetStrings() {
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fetchWeights = async () => {
      try {
        const res = await fetch('/api/v1/reasoning/weights')
        if (res.ok) {
          const data: Weights = await res.json()
          setWeights(data)
        }
      } catch {
        // fallback to defaults
      } finally {
        setLoading(false)
      }
    }
    fetchWeights()
  }, [])

  const handleChange = useCallback((key: keyof Weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }))

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSaving(true)
      fetch('/api/v1/reasoning/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...weights, [key]: value }),
      }).finally(() => setSaving(false))
    }, 400)
  }, [weights])

  const handleReset = useCallback(() => {
    setWeights(DEFAULT_WEIGHTS)
    setSaving(true)
    fetch('/api/v1/reasoning/weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_WEIGHTS),
    }).finally(() => setSaving(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="flex items-center justify-center h-48">
          <svg className="animate-spin h-5 w-5 text-historical-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-historical-700">
        <h2 className="text-lg font-bold text-historical-100">Reasoning Puppet Strings</h2>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-historical-500">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              saving
            </span>
          )}
        </div>
      </div>

      {/* Sliders */}
      <div className="p-6 space-y-6">
        {WEIGHT_CONFIGS.map(config => (
          <SliderRow
            key={config.key}
            config={config}
            value={weights[config.key]}
            onChange={handleChange}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-historical-700 bg-historical-800/50">
        <span className="text-xs text-historical-500">
          Changes are debounced and saved automatically
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-historical-400 hover:text-historical-200 hover:bg-historical-700 border border-historical-600 transition-all"
        >
          <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Reset Defaults
        </button>
      </div>
    </div>
  )
}
