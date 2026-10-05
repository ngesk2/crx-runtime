'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { SystemState } from '@/lib/gateway';

/**
 * ReplayMicrograph — can I trust the replay story?
 * Shows real replay aggregates. With zero runs it says so plainly;
 * it never draws a fake time series.
 */
export function ReplayMicrograph({ state }: { state: SystemState }) {
  const s = state as unknown as Record<string, Record<string, unknown>>;
  const replay = s['replay'] ?? {};
  const totalRuns = typeof replay['total_runs'] === 'number' ? replay['total_runs'] : 0;
  const failures = typeof replay['failures'] === 'number' ? replay['failures'] : 0;
  const successRate =
    typeof replay['success_rate'] === 'number' ? replay['success_rate'] : null;
  const latest = replay['latest_replay'];
  const stages =
    replay['lifecycle_stages'] && typeof replay['lifecycle_stages'] === 'object'
      ? (replay['lifecycle_stages'] as Record<string, number>)
      : null;

  const successes = totalRuns - failures;
  const successPct = totalRuns > 0 ? (successes / totalRuns) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <RotateCcw className="w-3.5 h-3.5 text-learning-400" aria-hidden="true" />
        <h4 className="text-xs font-semibold text-historical-500 uppercase tracking-wider">
          Replay health
        </h4>
      </div>
      {totalRuns === 0 ? (
        <p className="text-xs text-historical-500 py-2">
          No replay runs recorded yet. Replay health is unknown, not healthy.
        </p>
      ) : (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-semibold text-historical-100">
              {successRate !== null ? `${(successRate * 100).toFixed(1)}%` : `${successPct.toFixed(1)}%`}
            </span>
            <span className="text-[10px] text-historical-500">
              {totalRuns} runs · {failures} failed
            </span>
          </div>
          {/* Proportion bar: successes vs failures. Div-based, aria-described. */}
          <div
            role="img"
            aria-label={`Replay runs: ${successes} succeeded, ${failures} failed out of ${totalRuns}`}
            className="mt-2 h-2 rounded-full bg-historical-800 overflow-hidden flex"
          >
            <div
              className="h-full bg-learning-500/70"
              style={{ width: `${successPct}%` }}
            />
            <div
              className="h-full bg-production-500/80"
              style={{ width: `${100 - successPct}%` }}
            />
          </div>
          {latest ? (
            <p className="text-[11px] text-historical-500 mt-2 font-mono">
              latest: {String(latest)}
            </p>
          ) : null}
          {stages && Object.keys(stages).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {Object.entries(stages).map(([k, v]) => (
                <span key={k} className="text-[10px] font-mono text-historical-500">
                  {k.replace(/_/g, ' ').toLowerCase()}:{' '}
                  <span className="text-historical-300">{v}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
