'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { SystemState } from '@/lib/gateway';
import { PulsedValue, StatusDot } from './shared';

interface FlowStage {
  id: string;
  label: string;
  value: number;
  unit: string;
  healthy: boolean | null;
  hint: string;
}

/**
 * OperationalFlow — EVENTS → OBJECTS → KNOWLEDGE → MISSIONS → REPLAY.
 * Every stage is derived from real /system/state data. Stages the backend
 * does not expose (e.g. INGRESS) are omitted, not invented.
 * A glance answers: WHAT IS HAPPENING right now.
 */
export function OperationalFlow({ state }: { state: SystemState }) {
  const s = state as unknown as Record<string, Record<string, unknown>>;
  const num = (section: string, key: string): number => {
    const v = s[section]?.[key];
    return typeof v === 'number' ? v : 0;
  };
  const status = (section: string): boolean | null => {
    const v = s[section]?.['status'];
    if (v === 'available' || v === 'healthy') return true;
    if (v === 'unavailable' || v === 'unhealthy') return false;
    return null;
  };

  const stages: FlowStage[] = [
    {
      id: 'events',
      label: 'Events',
      value: num('postgres', 'total_events'),
      unit: 'total',
      healthy: status('postgres'),
      hint: `Event spine: ${num('postgres', 'streams')} streams, ${num('postgres', 'event_types')} event types.`,
    },
    {
      id: 'objects',
      label: 'Objects',
      value: num('repository', 'total_nodes'),
      unit: 'nodes',
      healthy: status('repository'),
      hint: `Repository graph: ${num('repository', 'total_edges')} edges, ${num('repository', 'duplicate_warnings')} duplicate warnings.`,
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      value: num('knowledge', 'knowledge_objects'),
      unit: 'objects',
      healthy: status('knowledge'),
      hint: `Evidence: ${num('knowledge', 'evidence')}, proofs: ${num('knowledge', 'proofs')}, witnesses: ${num('knowledge', 'witnesses')}, replay certs: ${num('knowledge', 'replay_certificates')}.`,
    },
    {
      id: 'missions',
      label: 'Missions',
      value: num('missions', 'queued') + num('missions', 'executing'),
      unit: 'active',
      healthy: status('missions'),
      hint: `Queued ${num('missions', 'queued')} · executing ${num('missions', 'executing')} · completed ${num('missions', 'completed')} · failed ${num('missions', 'failed')} · blocked ${num('missions', 'blocked')}.`,
    },
    {
      id: 'replay',
      label: 'Replay',
      value: num('replay', 'total_runs'),
      unit: 'runs',
      healthy: status('replay'),
      hint:
        num('replay', 'total_runs') > 0
          ? `Success rate ${(num('replay', 'success_rate') * 100).toFixed(1)}%, failures ${num('replay', 'failures')}.`
          : 'No replay runs recorded yet.',
    },
  ];

  return (
    <div
      role="list"
      aria-label="Operational flow: events through replay"
      className="flex items-stretch gap-1 overflow-x-auto"
    >
      {stages.map((stage, i) => (
        <React.Fragment key={stage.id}>
          <div
            role="listitem"
            title={stage.hint}
            className="flex-1 min-w-[120px] rounded-lg border border-historical-700 bg-historical-800/50 px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5">
              {stage.healthy !== null && <StatusDot healthy={stage.healthy} />}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-historical-500">
                {stage.label}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <PulsedValue
                value={stage.value.toLocaleString()}
                className="text-lg font-mono font-semibold text-historical-100"
                ariaLabel={`${stage.label}: ${stage.value} ${stage.unit}`}
              />
              <span className="text-[10px] text-historical-500">{stage.unit}</span>
            </div>
          </div>
          {i < stages.length - 1 && (
            <div className="flex items-center px-0.5" aria-hidden="true">
              <ArrowRight className="w-3.5 h-3.5 text-historical-600" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
