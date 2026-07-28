export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  title?: string;
  model: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export function createChat(model: string): Chat {
  return {
    id: crypto.randomUUID(),
    model,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function appendMessage(chat: Chat, message: Omit<ChatMessage, 'id'>): Chat {
  const newMessage: ChatMessage = {
    ...message,
    id: crypto.randomUUID(),
  };
  return {
    ...chat,
    messages: [...chat.messages, newMessage],
    updatedAt: new Date().toISOString(),
  };
}

export function saveChat(chat: Chat): void {
  // Save to localStorage for now
  const chats = JSON.parse(localStorage.getItem('crx-chats') || '[]');
  const existingIndex = chats.findIndex((c: Chat) => c.id === chat.id);
  if (existingIndex >= 0) {
    chats[existingIndex] = chat;
  } else {
    chats.push(chat);
  }
  localStorage.setItem('crx-chats', JSON.stringify(chats));
}

export function exportAsMarkdown(chat: Chat): string {
  let md = `# ${chat.title || 'Chat'}\n\n`;
  for (const msg of chat.messages) {
    const role = msg.role === 'user' ? 'You' : 'Assistant';
    md += `## ${role}\n\n${msg.content}\n\n`;
  }
  return md;
}

export function exportAsJson(chat: Chat): string {
  return JSON.stringify(chat, null, 2);
}
