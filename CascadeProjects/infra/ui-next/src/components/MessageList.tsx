"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  messages: ChatMessage[];
  streaming?: string;
  onCopy?: (content: string) => void;
  onRegenerate?: (msgId: string) => void;
  onEdit?: (msgId: string, newContent: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
}

function MessageActions({
  msg,
  onCopy,
  onRegenerate,
  onEdit,
}: {
  msg: ChatMessage;
  onCopy?: (c: string) => void;
  onRegenerate?: (id: string) => void;
  onEdit?: (id: string, c: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(msg.content);
  const taRef = useRef<HTMLTextAreaElement>(null);

  function handleCopy() {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      onCopy?.(msg.content);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function startEdit() {
    setEditValue(msg.content);
    setEditing(true);
    setTimeout(() => taRef.current?.focus(), 0);
  }

  function submitEdit() {
    if (editValue.trim() && editValue !== msg.content) {
      onEdit?.(msg.id, editValue.trim());
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="msg-edit">
        <textarea
          ref={taRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
            if (e.key === "Escape") setEditing(false);
          }}
          rows={Math.max(3, editValue.split("\n").length)}
          className="msg-edit__ta"
        />
        <div className="msg-edit__row">
          <button className="btn btn--primary btn--sm" onClick={submitEdit}>Resend</button>
          <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-actions">
      <button className="msg-action" onClick={handleCopy} title="Copy">
        {copied ? "✓" : <CopyIcon />}
      </button>
      {msg.role === "user" && onEdit && (
        <button className="msg-action" onClick={startEdit} title="Edit and resend">
          <EditIcon />
        </button>
      )}
      {msg.role === "assistant" && onRegenerate && (
        <button className="msg-action" onClick={() => onRegenerate(msg.id)} title="Regenerate">
          <RegenIcon />
        </button>
      )}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="5" width="9" height="9" rx="1.5"/>
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11.5 2.5a1.5 1.5 0 0 1 2.121 2.121L5.5 12.742 2 14l1.258-3.5L11.5 2.5z"/>
    </svg>
  );
}
function RegenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round"/>
      <polyline points="11,1 13.5,2.5 11,4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="message message--assistant">
      <div className="message__label">Assistant</div>
      <div className="message__bubble">
        <div className="typing-dots">
          <span/><span/><span/>
        </div>
      </div>
    </div>
  );
}

export default function MessageList({
  messages, streaming, onCopy, onRegenerate, onEdit, isStreaming, onStop,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  // Auto-scroll unless user scrolled up
  useEffect(() => {
    if (!userScrolled) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streaming, userScrolled]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setUserScrolled(!atBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (messages.length === 0 && !streaming && !isStreaming) {
    return (
      <div className="message-list message-list--empty">
        <div className="empty-state">
          <div className="empty-state__icon">◈</div>
          <p>Start a conversation</p>
          <p className="empty-state__hint">Type a message or use <kbd>/</kbd> for commands</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" ref={listRef}>
      {messages.map((msg) => (
        <div key={msg.id} className={`message message--${msg.role}`}>
          <div className="message__label">{msg.role === "user" ? "You" : "Assistant"}</div>
          <div className="message__bubble">
            {msg.role === "assistant" ? (
              <MarkdownRenderer content={msg.content} />
            ) : (
              <div className="user-content">{msg.content}</div>
            )}
            <MessageActions
              msg={msg}
              onCopy={onCopy}
              onRegenerate={onRegenerate}
              onEdit={onEdit}
            />
          </div>
        </div>
      ))}

      {/* Streaming state */}
      {isStreaming && !streaming && <TypingIndicator />}
      {streaming && (
        <div className="message message--assistant">
          <div className="message__label">Assistant</div>
          <div className="message__bubble">
            <MarkdownRenderer content={streaming} streaming />
          </div>
          {onStop && (
            <button className="stop-btn" onClick={onStop} title="Stop generation">
              ■ Stop
            </button>
          )}
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
}
