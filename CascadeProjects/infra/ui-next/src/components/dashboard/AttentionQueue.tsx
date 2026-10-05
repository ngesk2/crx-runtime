'use client';

import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, OctagonAlert } from 'lucide-react';
import type { SystemState } from '@/lib/gateway';

interface AttentionItem {
  id: string;
  severity: 'critical' | 'warning';
  label: string;
  detail: string;
}

function collectAttention(state: SystemState): AttentionItem[] {
  const s = state as unknown as Record<string, Record<string, unknown>>;
  const num = (section: string, key: string): number => {
    const v = s[section]?.[key];
    return typeof v === 'number' ? v : 0;
  };
  const items: AttentionItem[] = [];

  if (num('missions', 'failed') > 0)
    items.push({
      id: 'missions-failed',
      severity: 'critical',
      label: `${num('missions', 'failed')} mission${num('missions', 'failed') === 1 ? '' : 's'} failed`,
      detail: 'Inspect the mission queue for the failure cause.',
    });
  if (num('missions', 'blocked') > 0)
    items.push({
      id: 'missions-blocked',
      severity: 'warning',
      label: `${num('missions', 'blocked')} mission${num('missions', 'blocked') === 1 ? '' : 's'} blocked`,
      detail: 'Blocked missions are waiting on a missing capability or decision.',
    });
  if (num('replay', 'failures') > 0)
    items.push({
      id: 'replay-failures',
      severity: 'critical',
      label: `${num('replay', 'failures')} replay failure${num('replay', 'failures') === 1 ? '' : 's'}`,
      detail: 'Replay diverged from its witness. Do not trust the projection until reconciled.',
    });
  if (s['replay']?.['status'] === 'unavailable')
    items.push({
      id: 'replay-down',
      severity: 'warning',
      label: 'Replay engine unavailable',
      detail: 'Replay verification is not running. Executions cannot be re-verified right now.',
    });
  if (s['qdrant']?.['status'] === 'unavailable')
    items.push({
      id: 'qdrant-down',
      severity: 'warning',
      label: 'Qdrant unavailable',
      detail: 'Vector retrieval is down. Knowledge queries may be incomplete.',
    });
  const conflicts = num('organizational_health', 'intent_conflicts');
  if (conflicts > 0)
    items.push({
      id: 'intent-conflicts',
      severity: 'warning',
      label: `${conflicts} intent conflict${conflicts === 1 ? '' : 's'}`,
      detail: 'Conflicting intents need a human decision. Nothing was auto-resolved.',
    });
  const violations =
    num('organizational_health', 'authority_violations') +
    num('organizational_health', 'capability_violations');
  if (violations > 0)
    items.push({
      id: 'violations',
      severity: 'critical',
      label: `${violations} authority/capability violation${violations === 1 ? '' : 's'}`,
      detail: 'Something acted outside its authority. Review immediately.',
    });
  if (num('repository', 'duplicate_warnings') > 0)
    items.push({
      id: 'dupes',
      severity: 'warning',
      label: `${num('repository', 'duplicate_warnings')} duplicate warnings`,
      detail: 'The repository flagged possible duplicate authorities or capabilities.',
    });

  return items.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1,
  );
}

/**
 * AttentionQueue — NEEDS ME, derived from real system state.
 * Empty is an honest "all clear", not an absent panel.
 */
export function AttentionQueue({ state }: { state: SystemState }) {
  const items = collectAttention(state);

  return (
    <div aria-live="polite">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-3.5 h-3.5 text-constitutional-400" aria-hidden="true" />
        <h4 className="text-xs font-semibold text-historical-500 uppercase tracking-wider">
          Needs attention
        </h4>
        {items.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-production-500/15 text-production-300">
            {items.length}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-historical-500 py-2">
          <CheckCircle2 className="w-4 h-4 text-learning-400" aria-hidden="true" />
          <span>All clear. Nothing needs you right now.</span>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map(item => (
            <li
              key={item.id}
              title={item.detail}
              className="flex items-start gap-2 rounded-lg border border-historical-700 bg-historical-800/50 px-3 py-2"
            >
              {item.severity === 'critical' ? (
                <OctagonAlert className="w-3.5 h-3.5 mt-0.5 text-production-400 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-constitutional-400 shrink-0" aria-hidden="true" />
              )}
              <div>
                <p className="text-xs font-medium text-historical-200">{item.label}</p>
                <p className="text-[11px] text-historical-500 mt-0.5">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
