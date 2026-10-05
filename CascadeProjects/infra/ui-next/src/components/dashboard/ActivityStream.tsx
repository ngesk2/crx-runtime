'use client';

import React from 'react';
import { Plus, CheckCircle2, Database, Brain, XCircle } from 'lucide-react';

export interface StreamEntry {
  id: string;
  at: string;
  text: string;
  kind: 'events' | 'missions' | 'knowledge' | 'alert';
}

const KIND_ICON = {
  events: Database,
  missions: CheckCircle2,
  knowledge: Brain,
  alert: XCircle,
} as const;

const KIND_COLOR = {
  events: 'text-observability-300',
  missions: 'text-learning-300',
  knowledge: 'text-retrieval-300',
  alert: 'text-production-300',
} as const;

/**
 * ActivityStream — JUST HAPPENED, derived from consecutive /system/state
 * snapshots. These are snapshot deltas, honestly labeled; they are not a
 * real-time event feed, and they never invent events the backend did not
 * report. Settled entries never re-animate.
 */
export function ActivityStream({ entries }: { entries: StreamEntry[] }) {
  return (
    <div>
      <h4
        className="text-xs font-semibold text-historical-500 uppercase tracking-wider mb-2"
        title="Derived from consecutive system-state snapshots, not a live event feed"
      >
        Activity
      </h4>
      {entries.length === 0 ? (
        <p className="text-xs text-historical-500 py-2">
          No changes since the last snapshot. The stream is quiet.
        </p>
      ) : (
        <ul aria-live="polite" aria-label="Recent activity" className="space-y-1 max-h-44 overflow-y-auto">
          {entries.map(entry => {
            const Icon = KIND_ICON[entry.kind];
            return (
              <li
                key={entry.id}
                className="motion-stream-in flex items-start gap-2 text-xs py-1 border-b border-historical-800/60 last:border-0"
              >
                <Icon
                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${KIND_COLOR[entry.kind]}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-historical-300 leading-snug">{entry.text}</p>
                  <p className="text-[10px] text-historical-600 font-mono">{entry.at}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

let seq = 0;

/** Diff two state snapshots into stream entries. Pure, testable. */
export function diffSnapshots(
  prev: Record<string, Record<string, unknown>> | null,
  next: Record<string, Record<string, unknown>>,
): StreamEntry[] {
  if (!prev) return [];
  const entries: StreamEntry[] = [];
  const at = new Date().toLocaleTimeString();
  const num = (snap: Record<string, Record<string, unknown>>, section: string, key: string) => {
    const v = snap[section]?.[key];
    return typeof v === 'number' ? v : 0;
  };

  const eventDelta = num(next, 'postgres', 'total_events') - num(prev, 'postgres', 'total_events');
  if (eventDelta > 0)
    entries.push({
      id: `e${seq++}`,
      at,
      kind: 'events',
      text: `${eventDelta.toLocaleString()} new event${eventDelta === 1 ? '' : 's'} recorded`,
    });

  const completedDelta = num(next, 'missions', 'completed') - num(prev, 'missions', 'completed');
  if (completedDelta > 0)
    entries.push({
      id: `m${seq++}`,
      at,
      kind: 'missions',
      text: `${completedDelta} mission${completedDelta === 1 ? '' : 's'} completed`,
    });

  const failedDelta = num(next, 'missions', 'failed') - num(prev, 'missions', 'failed');
  if (failedDelta > 0)
    entries.push({
      id: `f${seq++}`,
      at,
      kind: 'alert',
      text: `${failedDelta} mission${failedDelta === 1 ? '' : 's'} failed`,
    });

  const knowledgeDelta =
    num(next, 'knowledge', 'knowledge_objects') - num(prev, 'knowledge', 'knowledge_objects');
  if (knowledgeDelta > 0)
    entries.push({
      id: `k${seq++}`,
      at,
      kind: 'knowledge',
      text: `${knowledgeDelta} knowledge object${knowledgeDelta === 1 ? '' : 's'} added`,
    });

  const evidenceDelta = num(next, 'knowledge', 'evidence') - num(prev, 'knowledge', 'evidence');
  if (evidenceDelta > 0)
    entries.push({
      id: `ev${seq++}`,
      at,
      kind: 'knowledge',
      text: `${evidenceDelta} evidence record${evidenceDelta === 1 ? '' : 's'} added`,
    });

  return entries;
}
