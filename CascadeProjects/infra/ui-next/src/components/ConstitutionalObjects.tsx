'use client';

import { useState, useEffect } from 'react';

interface Authority {
  name: string;
  file_path: string;
  health_score: number;
  confidence: number;
  objects_count: number;
  consumers_count: number;
  last_modified: string;
  skills?: { name: string; description: string }[];
}

interface Law {
  name: string;
  article_count: number;
  last_ratified: string;
}

interface ConstitutionalData {
  authorities: Authority[];
  laws: Law[];
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-24 h-2 bg-historical-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export default function ConstitutionalObjects() {
  const [data, setData] = useState<ConstitutionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/v1/constitutional/objects')
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const toggleExpand = (name: string) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  const filteredAuthorities = data?.authorities.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (loading) return <div className="bg-historical-900 rounded-lg border border-historical-700 p-6 text-historical-300">Loading constitutional objects...</div>;
  if (error) return <div className="bg-historical-900 rounded-lg border border-historical-700 p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="bg-historical-900 rounded-lg border border-historical-700 p-6">
      <h2 className="text-lg font-semibold text-historical-100 mb-4">Constitutional Objects</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter authorities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded bg-historical-800 border border-historical-700 text-historical-200 placeholder-historical-500 focus:outline-none focus:border-indigo-500 text-sm"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-historical-300 uppercase tracking-wider mb-2">Authorities ({filteredAuthorities.length})</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredAuthorities.map(a => (
            <div key={a.name} className="bg-historical-800 border border-historical-700 rounded-lg">
              <button onClick={() => toggleExpand(a.name)} className="w-full flex items-center gap-2 p-3 text-left hover:bg-historical-750 transition-colors rounded-lg">
                <span className="text-historical-400 shrink-0">{expanded[a.name] ? <ChevronDown /> : <ChevronRight />}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-historical-100 font-medium truncate">{a.name}</span>
                    <span className="text-xs text-historical-500 truncate">{a.file_path}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs">
                    <span className="text-historical-400">Health: <HealthBar score={a.health_score} /> <span className="ml-1">{a.health_score}</span></span>
                    <span className="text-historical-400">{a.confidence}%</span>
                    <span className="text-historical-400">{a.objects_count} objects</span>
                    <span className="text-historical-400">{a.consumers_count} consumers</span>
                    <span className="text-historical-500">{a.last_modified}</span>
                  </div>
                </div>
              </button>
              {expanded[a.name] && a.skills && a.skills.length > 0 && (
                <div className="px-3 pb-3 pl-10 space-y-1">
                  {a.skills.map(s => (
                    <div key={s.name} className="text-sm text-historical-300 py-1">
                      <span className="font-medium text-historical-200">{s.name}</span>
                      {s.description && <span className="text-historical-400 ml-2">{s.description}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-historical-300 uppercase tracking-wider mb-2">Laws ({data?.laws.length ?? 0})</h3>
        <div className="space-y-1">
          {(data?.laws ?? []).map(l => (
            <div key={l.name} className="flex items-center justify-between px-3 py-2 bg-historical-800 rounded border border-historical-700">
              <span className="text-historical-100 text-sm font-medium">{l.name}</span>
              <div className="flex items-center gap-4 text-xs text-historical-400">
                <span>{l.article_count} articles</span>
                <span>Ratified: {l.last_ratified}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
