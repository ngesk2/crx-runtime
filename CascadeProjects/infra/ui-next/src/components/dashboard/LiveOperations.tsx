'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import { fetchSystemState, type SystemState } from '@/lib/gateway';
import { OperationalFlow } from './OperationalFlow';
import { AttentionQueue } from './AttentionQueue';
import { ReplayMicrograph } from './ReplayMicrograph';
import { ActivityStream, diffSnapshots, type StreamEntry } from './ActivityStream';
import { FreshnessBadge } from '../provenance';

const POLL_INTERVAL = 30000;
const MAX_STREAM = 12;

/**
 * LiveOperations — the living layer of the cockpit.
 * Fetches the real /system/state shape (the same one lib/gateway already
 * models) and renders: operational flow, replay health, attention queue,
 * and a snapshot-delta activity stream. No mock data: where the backend
 * has nothing, the UI says so.
 */
export default function LiveOperations() {
  const [state, setState] = useState<SystemState | null>(null);
  const [prev, setPrev] = useState<Record<string, Record<string, unknown>> | null>(null);
  const [stream, setStream] = useState<StreamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchState = useCallback(async () => {
    try {
      const data = await fetchSystemState();
      if (!mounted.current) return;
      const snap = data as unknown as Record<string, Record<string, unknown>>;
      setPrev(old => {
        const entries = diffSnapshots(old, snap);
        if (entries.length > 0) {
          setStream(s => [...entries, ...s].slice(0, MAX_STREAM));
        }
        return snap;
      });
      setState(data);
      setGeneratedAt(data.generated_at ?? null);
      setError(null);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Failed to fetch system state');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchState();
    const interval = setInterval(fetchState, POLL_INTERVAL);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchState]);

  if (loading) {
    return (
      <div className="rounded-lg border border-historical-700 bg-historical-900 p-4">
        <div className="flex items-center gap-3 text-historical-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Connecting to live operations…</span>
        </div>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="rounded-lg border border-historical-700 bg-historical-900 p-4">
        <div className="flex items-center gap-2 text-sm text-historical-300">
          <AlertTriangle className="w-4 h-4 text-production-400" aria-hidden="true" />
          <span>Live operations unavailable</span>
        </div>
        <p className="text-xs text-historical-500 mt-1">{error}</p>
        <button
          onClick={fetchState}
          className="mt-3 px-3 py-1.5 bg-historical-800 hover:bg-historical-700 text-historical-300 text-xs rounded-lg border border-historical-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!state) return null;

  return (
    <section aria-label="Live operations" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-observability-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-historical-200 uppercase tracking-wider">
            Live operations
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <FreshnessBadge observedAt={generatedAt} />
          <button
            onClick={fetchState}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-historical-800 hover:bg-historical-700 text-historical-300 text-xs rounded-lg border border-historical-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <OperationalFlow state={state} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-historical-700 bg-historical-900 p-4">
          <ActivityStream entries={stream} />
        </div>
        <div className="rounded-lg border border-historical-700 bg-historical-900 p-4">
          <ReplayMicrograph state={state} />
        </div>
        <div className="rounded-lg border border-historical-700 bg-historical-900 p-4">
          <AttentionQueue state={state} />
        </div>
      </div>
    </section>
  );
}
