'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, apiPost } from '@/lib/gateway';

interface MissionCard {
  id: string;
  title: string;
  roi_score: number;
  confidence: number;
  estimated_time: string;
  authority_tags: string[];
  replay_safe: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

interface MutationError {
  op: 'status' | 'reorder';
  id?: string;
  action?: 'approve' | 'reject';
  index?: number;
  dir?: -1 | 1;
  message: string;
}

export default function MissionCards() {
  const [cards, setCards] = useState<MissionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<MutationError | null>(null);

  const loadCards = useCallback(async () => {
    const d = await apiFetch('/api/v1/missions/cards');
    return (d.cards ?? d) as MissionCard[];
  }, []);

  useEffect(() => {
    loadCards()
      .then(c => { setCards(c); setLoading(false); })
      .catch(e => { setError(e instanceof Error ? e.message : 'Failed to fetch'); setLoading(false); });
  }, [loadCards]);

  const moveCard = useCallback((index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= cards.length) return;
    const prev = cards;
    const next = [...cards];
    [next[index], next[target]] = [next[target], next[index]];
    const movingId = next[target].id;
    setCards(next);
    setPendingId(movingId);
    setMutationError(null);
    apiPost('/api/v1/missions/cards/reorder', { cardIds: next.map(c => c.id) })
      .then(() => setPendingId(null))
      .catch((e) => {
        // ROLL BACK: the server never confirmed the reorder, so the UI must not keep it.
        setCards(prev);
        setPendingId(null);
        setMutationError({
          op: 'reorder', index, dir,
          message: e instanceof Error ? e.message : 'Reorder failed',
        });
      });
  }, [cards]);

  const updateStatus = useCallback((id: string, action: 'approve' | 'reject') => {
    setPendingId(id);
    setMutationError(null);
    apiPost(`/api/v1/missions/cards/${id}/${action}`)
      .then(() => {
        setCards(prev => prev.map(c => c.id === id ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c));
        setPendingId(null);
      })
      .catch((e) => {
        // No optimistic application: the card keeps its old status. The failure is shown, not swallowed.
        setPendingId(null);
        setMutationError({
          op: 'status', id, action,
          message: e instanceof Error ? e.message : 'Update failed',
        });
      });
  }, []);

  const retryMutation = useCallback(() => {
    const m = mutationError;
    setMutationError(null);
    if (!m) return;
    if (m.op === 'status' && m.id && m.action) {
      updateStatus(m.id, m.action);
    } else if (m.op === 'reorder' && m.index !== undefined && m.dir !== undefined) {
      moveCard(m.index, m.dir);
    }
  }, [mutationError, updateStatus, moveCard]);

  const roiColor = (score: number) => score >= 8 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : 'text-gray-400';
  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-blue-600 text-blue-100';
      case 'approved': return 'bg-green-700 text-green-100';
      case 'rejected': return 'bg-red-700 text-red-100';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  if (loading) return <div className="bg-historical-900 rounded-lg border border-historical-700 p-6 text-historical-300">Loading missions...</div>;
  if (error) return <div className="bg-historical-900 rounded-lg border border-historical-700 p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
      <h2 className="text-lg font-semibold text-historical-100 mb-4">Mission Cards</h2>
      {mutationError && (
        <div className="mb-4 flex items-center justify-between gap-3 text-xs text-production-400 bg-production-900/30 border border-production-700 rounded px-3 py-2">
          <span>
            {mutationError.op === 'status' ? 'Status not saved' : 'Reorder not saved'}: {mutationError.message}.
            {mutationError.op === 'reorder' ? ' Order restored.' : ' Nothing changed.'}
          </span>
          <button onClick={retryMutation} className="shrink-0 px-2 py-1 rounded bg-production-800 text-production-100 hover:bg-production-700">
            Retry
          </button>
        </div>
      )}
      <div className="space-y-3 transition-all duration-300">
        {cards.map((card, i) => {
          const pending = pendingId === card.id;
          return (
          <div key={card.id} className={`bg-historical-800 border border-historical-700 rounded-lg p-4 transition-all duration-300 ${pending ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-historical-100 font-medium">{card.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(card.status)}`}>
                    {pending ? 'saving…' : card.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm mt-2">
                  <span className={roiColor(card.roi_score)}>
                    <span className="text-2xl font-bold">{card.roi_score.toFixed(1)}</span>
                    <span className="text-historical-400 ml-1">ROI</span>
                  </span>
                  <span className="text-historical-300">{card.confidence}% confidence</span>
                  <span className="text-historical-400">{card.estimated_time}</span>
                  <span className={`inline-flex items-center gap-1 text-xs ${card.replay_safe ? 'text-green-400' : 'text-red-400'}`}>
                    {card.replay_safe ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                    Replay Safe
                  </span>
                </div>
                {card.authority_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {card.authority_tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-indigo-900/60 text-indigo-200 border border-indigo-700/50">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 ml-3">
                <div className="flex gap-1">
                  <button onClick={() => moveCard(i, -1)} disabled={i === 0 || pending} className="p-1.5 rounded bg-historical-700 text-historical-300 hover:bg-historical-600 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button onClick={() => moveCard(i, 1)} disabled={i === cards.length - 1 || pending} className="p-1.5 rounded bg-historical-700 text-historical-300 hover:bg-historical-600 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => updateStatus(card.id, 'approve')} disabled={pending} className="p-1.5 rounded bg-green-800 text-green-200 hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Approve">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <button onClick={() => updateStatus(card.id, 'reject')} disabled={pending} className="p-1.5 rounded bg-red-800 text-red-200 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Reject">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
