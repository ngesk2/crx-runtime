'use client'

import { useEffect, useState, useCallback } from 'react'

interface OllamaStatus {
  status: string
  running_jobs: number
  idle_since: string | null
  total_jobs: number
  completed_jobs: number
  model: string
}

interface Job {
  id: string
  name: string
  status: 'idle' | 'running' | 'completed'
  last_run: string | null
  category: string
}

interface JobsResponse {
  jobs: Job[]
  status: OllamaStatus
}

const CATEGORY_ORDER = ['analysis', 'mining', 'verification', 'documentation', 'monitoring', 'maintenance', 'planning']

function StatusBadge({ status }: { status: 'idle' | 'running' | 'completed' }) {
  const colors = {
    idle: 'bg-historical-600 text-historical-300',
    running: 'bg-learning-500/20 text-learning-400',
    completed: 'bg-constitutional-500/20 text-constitutional-400',
  }
  const pulse = status === 'running' ? 'animate-pulse' : ''
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]} ${pulse}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'bg-learning-400 animate-pulse' : status === 'completed' ? 'bg-constitutional-400' : 'bg-historical-400'}`} />
      {status}
    </span>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-historical-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function Checkmark() {
  return (
    <svg className="w-5 h-5 text-constitutional-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export default function OllamaControlRoom() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [status, setStatus] = useState<OllamaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningJobIds, setRunningJobIds] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, statusRes] = await Promise.all([
        fetch('/api/v1/ollama/jobs'),
        fetch('/api/v1/ollama/status'),
      ])
      if (jobsRes.ok && statusRes.ok) {
        const jobsData: JobsResponse = await jobsRes.json()
        setJobs(jobsData.jobs)
        setStatus(jobsData.status)
      }
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const runJob = useCallback(async (jobId: string) => {
    setRunningJobIds(prev => new Set(prev).add(jobId))
    try {
      await fetch(`/api/v1/ollama/jobs/${jobId}/run`, { method: 'POST' })
      await fetchData()
    } catch {
      // handled
    } finally {
      setRunningJobIds(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }, [fetchData])

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    jobs: jobs.filter(j => j.category === cat),
  })).filter(g => g.jobs.length > 0)

  const runningCount = jobs.filter(j => j.status === 'running').length
  const idleCount = jobs.filter(j => j.status === 'idle').length
  const completedCount = jobs.filter(j => j.status === 'completed').length

  if (loading) {
    return (
      <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
        <div className="flex items-center justify-center h-48">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700">
      {/* Status Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-historical-700">
        <h2 className="text-lg font-bold text-historical-100">Ollama Control Room</h2>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-historical-400">
            <span className={`w-2 h-2 rounded-full ${status?.status === 'idle' ? 'bg-gray-500' : 'bg-learning-400 animate-pulse'}`} />
            {status?.status ?? 'unknown'}
          </span>
          <span className="text-xs text-historical-500">Model: {status?.model ?? '-'}</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-px bg-historical-700">
        <div className="bg-historical-900 px-6 py-3">
          <div className="text-xs text-historical-500">Running</div>
          <div className="text-lg font-bold text-learning-400">{runningCount}</div>
        </div>
        <div className="bg-historical-900 px-6 py-3">
          <div className="text-xs text-historical-500">Idle</div>
          <div className="text-lg font-bold text-historical-300">{idleCount}</div>
        </div>
        <div className="bg-historical-900 px-6 py-3">
          <div className="text-xs text-historical-500">Completed</div>
          <div className="text-lg font-bold text-constitutional-400">{completedCount}</div>
        </div>
      </div>

      {/* Category Groups */}
      <div className="p-6 space-y-8">
        {grouped.map(group => (
          <div key={group.category}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-historical-500 mb-3">
              {group.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.jobs.map(job => {
                const isRunning = runningJobIds.has(job.id) || job.status === 'running'
                const isCompleted = job.status === 'completed'
                return (
                  <div
                    key={job.id}
                    className={`relative bg-historical-800 rounded-lg border p-4 transition-all ${
                      isCompleted
                        ? 'border-constitutional-500/40 shadow-[0_0_12px_rgba(52,211,153,0.08)]'
                        : 'border-historical-700'
                    }`}
                  >
                    {isCompleted && (
                      <div className="absolute top-3 right-3">
                        <Checkmark />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-historical-200 pr-6">{job.name}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-historical-500">
                          {job.last_run ? new Date(job.last_run).toLocaleString() : 'Never'}
                        </span>
                        <span className="text-xs text-historical-600">{job.category}</span>
                      </div>
                      <button
                        onClick={() => runJob(job.id)}
                        disabled={isRunning}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          isRunning
                            ? 'bg-historical-700 text-historical-500 cursor-not-allowed'
                            : 'bg-constitutional-500/10 text-constitutional-400 hover:bg-constitutional-500/20 border border-constitutional-500/30'
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <Spinner />
                            Running...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Run
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-historical-700 bg-historical-800/50">
        <div className="flex items-center gap-3 text-xs text-historical-400">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${status?.status === 'idle' ? 'bg-gray-500' : 'bg-learning-400 animate-pulse'}`} />
            System {status?.status === 'idle' ? 'idle' : 'active'}
          </span>
          <span>{jobs.length} total jobs</span>
        </div>
        <button
          onClick={fetchData}
          className="text-xs text-historical-500 hover:text-historical-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  )
}
