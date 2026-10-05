'use client';

import React, { useEffect, useRef } from 'react';
import { X, Network, ShieldQuestion } from 'lucide-react';
import {
  ProvenanceBadge,
  ConfidenceIndicator,
  WitnessBadge,
  ReplayBadge,
  FreshnessBadge,
  type ProvenanceState,
} from './provenance';

export interface InspectorNode {
  id: string;
  name: string;
  type: string;
  color?: string;
  confidence?: number;
  authority?: string;
  replay_verified?: boolean;
}

interface EvidenceInspectorProps {
  node: InspectorNode | null;
  onClose: () => void;
}

/**
 * EvidenceInspector — click/tap WHY → causal evidence without leaving context.
 *
 * Shows what the backend actually exposes for the node (type, authority,
 * confidence, replay flag) and says plainly what it does NOT expose yet
 * (evidence chain, witness digests, replay runs). Never fabricates.
 *
 * Drawer pattern: non-modal, Esc closes, focus moves in on open and
 * returns to the trigger on close. Keyboard path: the trigger is a real
 * button-role element; Enter/Space opens.
 */
export function EvidenceInspector({ node, onClose }: EvidenceInspectorProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Esc to close + focus management.
  useEffect(() => {
    if (!node) return;
    triggerRef.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [node, onClose]);

  if (!node) return null;

  const provenance: ProvenanceState = node.replay_verified
    ? 'REPLAY_VERIFIED'
    : node.confidence != null
      ? 'INFERRED'
      : 'UNKNOWN';

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={`Evidence inspector: ${node.name}`}
      className="motion-view-fade fixed top-0 right-0 h-full w-full sm:w-[380px] z-40 bg-historical-900 border-l border-historical-700 shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-historical-700 bg-historical-800/50">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-historical-500">
            {node.type}
          </p>
          <h2 className="text-sm font-semibold text-historical-100 truncate" title={node.name}>
            {node.name}
          </h2>
          <p className="text-[10px] font-mono text-historical-600 truncate" title={node.id}>
            {node.id}
          </p>
        </div>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close evidence inspector"
          className="p-1.5 rounded-lg text-historical-400 hover:text-historical-100 hover:bg-historical-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-runtime-400"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Provenance */}
        <section aria-label="Provenance">
          <h3 className="text-xs font-semibold text-historical-500 uppercase tracking-wider mb-2">
            Provenance
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <ProvenanceBadge
              state={provenance}
              detail={node.authority ? `Authority: ${node.authority}` : undefined}
            />
            <ConfidenceIndicator value={node.confidence ?? null} />
            <ReplayBadge state={node.replay_verified ? 'VERIFIED' : 'NOT_RUN'} />
          </div>
          {node.authority && (
            <p className="text-xs text-historical-400 mt-2">
              Authority: <span className="text-historical-200">{node.authority}</span>
            </p>
          )}
        </section>

        {/* Witness */}
        <section aria-label="Witness">
          <h3 className="text-xs font-semibold text-historical-500 uppercase tracking-wider mb-2">
            Witness
          </h3>
          <WitnessBadge state="UNKNOWN" />
        </section>

        {/* Freshness */}
        <section aria-label="Freshness">
          <h3 className="text-xs font-semibold text-historical-500 uppercase tracking-wider mb-2">
            Freshness
          </h3>
          <FreshnessBadge observedAt={null} />
        </section>

        {/* Causal chain: what we know */}
        <section aria-label="Causal chain">
          <h3 className="text-xs font-semibold text-historical-500 uppercase tracking-wider mb-2">
            Causal chain
          </h3>
          <ol className="space-y-0">
            {[
              { label: 'Knowledge graph node', value: node.name },
              { label: 'Node type', value: node.type },
              ...(node.authority ? [{ label: 'Recorded authority', value: node.authority }] : []),
            ].map((step, i, arr) => (
              <li key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-runtime-400 mt-1.5" />
                  {i < arr.length - 1 && <span className="w-px flex-1 bg-historical-700" />}
                </div>
                <div className="pb-3">
                  <p className="text-[11px] text-historical-500">{step.label}</p>
                  <p className="text-xs text-historical-200">{step.value}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Honest boundary: what the backend does not expose yet */}
        <section
          aria-label="Not yet available"
          className="rounded-lg border border-historical-700 bg-historical-800/40 p-3"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldQuestion className="w-3.5 h-3.5 text-historical-500" aria-hidden="true" />
            <h3 className="text-xs font-semibold text-historical-400">
              Not exposed by the backend yet
            </h3>
          </div>
          <ul className="text-[11px] text-historical-500 space-y-1 list-disc list-inside">
            <li>Evidence chain (observation → extraction → verification)</li>
            <li>Witness digests for this node</li>
            <li>Replay runs and stage-level diffs</li>
            <li>Freshness timestamps</li>
          </ul>
          <p className="text-[11px] text-historical-600 mt-2">
            These render as unavailable until the backend contract lands.
            Nothing here is inferred or invented.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-historical-700 bg-historical-800/30">
        <p className="text-[10px] text-historical-600 flex items-center gap-1.5">
          <Network className="w-3 h-3" aria-hidden="true" />
          Selecting a node illuminates its recorded context. Esc closes.
        </p>
      </div>
    </aside>
  );
}
