'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/gateway';

type Status = 'checking' | 'reachable' | 'unreachable';

/**
 * The landing page's health claim, derived from a live gateway probe.
 * Never a static "all systems nominal".
 */
export default function GatewayStatus() {
  const [status, setStatus] = useState<Status>('checking');
  const [detail, setDetail] = useState<string>('');

  const probe = useCallback(async () => {
    setStatus('checking');
    try {
      await apiFetch('/system/state');
      setStatus('reachable');
      setDetail('');
    } catch (e) {
      setStatus('unreachable');
      setDetail(e instanceof Error ? e.message : 'Probe failed');
    }
  }, []);

  useEffect(() => {
    probe();
  }, [probe]);

  if (status === 'checking') {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-historical-500 animate-pulse" />
        Checking gateway…
      </span>
    );
  }

  if (status === 'reachable') {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-learning-400" />
        Gateway reachable
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-production-400" />
      Gateway unreachable
      <button
        onClick={probe}
        className="underline hover:text-historical-400 transition-colors"
        title={detail}
      >
        retry
      </button>
    </span>
  );
}
