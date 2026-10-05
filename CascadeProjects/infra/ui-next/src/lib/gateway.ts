const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080';

export function gatewayUrl(): string {
  return GATEWAY_URL;
}

export interface SessionConfig {
  model: string;
  temperature?: number;
  stream?: boolean;
}

export interface SystemState {
  version: string;
  generated_at: string;
  containers: { status: string; containers: any[] };
  git: { status: string; branch: string; pending_changes: number; recent_commits: any[] };
  repository: { status: string; intents: number; authorities: number; capabilities: number; specifications: number; total_nodes: number; total_edges: number; duplicate_warnings: number };
  knowledge: { status: string; knowledge_objects: number; reflections: number; skills: number; policies: number; evidence: number; proofs: number; witnesses: number; replay_certificates: number; historical_snapshots: number };
  missions: { status: string; queued: number; executing: number; completed: number; failed: number; blocked: number };
  replay: { status: string; total_runs: number; success_rate: number; failures: number; latest_replay: string | null; witness_coverage: number };
  postgres: { status: string; total_events: number; streams: number; event_types: number; oldest_event: string | null; newest_event: string | null };
  qdrant: { status: string; collections: number; total_points: number; total_vectors: number };
  metrics: { uptime_seconds: number; total_requests: number; total_errors: number };
  organizational_health: { authority_violations: number; capability_violations: number; intent_conflicts: number; confidence_decay: number };
}

/**
 * Typed gateway failure. Never silently swallowed: every apiFetch/apiPost
 * rejection carries where it tried to reach and what the gateway said.
 */
export class GatewayError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
  }
}

/**
 * Canonical gateway GET/POST. All ui-next gateway traffic goes through here.
 * Throws GatewayError on unreachable host or non-2xx — never returns null,
 * never resolves to undefined data.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${GATEWAY_URL}${path}`, init);
  } catch (e) {
    throw new GatewayError(
      `Gateway unreachable at ${GATEWAY_URL} (${path}): ${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (!response.ok) {
    throw new GatewayError(`Gateway error ${response.status} on ${path}`, response.status);
  }
  return response.json();
}

export async function apiPost(path: string, body?: unknown): Promise<any> {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function fetchSystemState(): Promise<SystemState> {
  return apiFetch('/system/state');
}

export async function fetchJson(path: string): Promise<any> {
  return apiFetch(path);
}

export async function* streamChat(messages: Array<{role: string; content: string}>, config: SessionConfig): AsyncGenerator<string> {
  const data = await apiPost('/api/v1/chat', {
    model: config.model,
    messages,
    stream: false,
    temperature: config.temperature || 0.7,
  });
  yield data.content;
}

export async function chat(messages: Array<{role: string; content: string}>, config: SessionConfig): Promise<{content: string; model: string; provider: string}> {
  return apiPost('/api/v1/chat', {
    model: config.model,
    messages,
    stream: false,
    temperature: config.temperature || 0.7,
  });
}
