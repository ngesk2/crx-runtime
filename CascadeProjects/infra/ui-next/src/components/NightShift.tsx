'use client';

import { useState, useEffect } from 'react';

interface NightShiftData {
  active: boolean;
  current_time: string;
  current_work: string;
  operator_required: boolean;
  stats: {
    patterns_mined: number;
    replays_reviewed: number;
    missions_generated: number;
    confidence_updates: number;
  };
}

function CrescentMoon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-300">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Star() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-300">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function NightShift() {
  const [data, setData] = useState<NightShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/system/nightshift')
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="bg-historical-900 rounded-lg border border-historical-700 p-6 text-historical-300">Loading night shift...</div>;
  if (error) return <div className="bg-historical-900 rounded-lg border border-historical-700 p-6 text-red-400">Error: {error}</div>;
  if (!data) return null;

  const active = data.active;

  return (
    <div className={`bg-historical-900 rounded-lg border ${active ? 'border-indigo-700/60 shadow-lg shadow-indigo-900/20' : 'border-historical-700'} p-6 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${active ? 'bg-indigo-900/50' : 'bg-historical-800'}`}>
            <CrescentMoon />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-historical-100">Night Shift</h2>
            {data.current_time && <p className="text-xs text-historical-400">{data.current_time}</p>}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${active ? 'bg-indigo-800 text-indigo-200' : 'bg-gray-700 text-gray-300'}`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {active && (
        <div className="flex items-center gap-1 mb-3">
          <Star /><Star /><Star />
        </div>
      )}

      <div className="space-y-3">
        <div className="bg-historical-800 rounded-lg p-3 border border-historical-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-historical-400 uppercase tracking-wider">Current work</span>
            {data.operator_required && (
              <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">Operator required</span>
            )}
          </div>
          <p className="text-sm text-historical-200">{data.current_work || 'Idle'}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-historical-800 rounded p-2.5 border border-historical-700">
            <span className="text-lg font-bold text-historical-100">{data.stats.patterns_mined}</span>
            <p className="text-xs text-historical-400">Patterns mined</p>
          </div>
          <div className="bg-historical-800 rounded p-2.5 border border-historical-700">
            <span className="text-lg font-bold text-historical-100">{data.stats.replays_reviewed}</span>
            <p className="text-xs text-historical-400">Replays reviewed</p>
          </div>
          <div className="bg-historical-800 rounded p-2.5 border border-historical-700">
            <span className="text-lg font-bold text-historical-100">{data.stats.missions_generated}</span>
            <p className="text-xs text-historical-400">Missions generated</p>
          </div>
          <div className="bg-historical-800 rounded p-2.5 border border-historical-700">
            <span className="text-lg font-bold text-historical-100">{data.stats.confidence_updates}</span>
            <p className="text-xs text-historical-400">Confidence updates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
