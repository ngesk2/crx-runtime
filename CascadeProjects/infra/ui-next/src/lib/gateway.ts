const GATEWAY_URL = 'http://localhost:8080';

export interface SessionConfig {
  model: string;
  temperature?: number;
  stream?: boolean;
}

export async function* streamChat(messages: Array<{role: string; content: string}>, config: SessionConfig): AsyncGenerator<string> {
  const response = await fetch(`${GATEWAY_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
      temperature: config.temperature || 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status}`);
  }

  const data = await response.json();
  yield data.content;
}

export async function chat(messages: Array<{role: string; content: string}>, config: SessionConfig): Promise<{content: string; model: string; provider: string}> {
  const response = await fetch(`${GATEWAY_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
      temperature: config.temperature || 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status}`);
  }

  return response.json();
}
