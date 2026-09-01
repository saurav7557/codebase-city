"use client";

import { useState, useRef, useEffect } from "react";
import { SystemButton } from "@/components/ui/SystemButton";


// ─────────────────────────────────────────────────────────────────────────────
// AskCityAI — Conversational interface for portfolio questions
//
// Allows visitors to ask questions about the actual portfolio data.
// Answers are based on real projects, technologies, and AI analysis.
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  evidence?: string[];
  confidence?: number;
  sources?: string[];
}

import type { CityBuilding } from "@/types/city";

interface AskCityAIProps {
  isOpen: boolean;
  onClose: () => void;
  building?: CityBuilding | null;
}

export function AskCityAI({
  isOpen,
  onClose,
  building,
}: AskCityAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  question: userMessage,
  buildingId: building?.id,
}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to get answer");
      }

      const data = await response.json();

      // Add assistant message
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.answer,
        evidence: data.evidence,
        confidence: data.confidence,
        sources: data.sources,
      }]);
    } catch (err) {
      console.error("Ask AI failed:", err);
      setError(err instanceof Error ? err.message : "Failed to get answer");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I couldn't process that question. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/10 sm:hidden panel-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="panel-enter fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-[var(--surface)] border-l border-[var(--border)] shadow-[var(--shadow-log)] flex flex-col"
        role="dialog"
        aria-labelledby="ask-ai-title"
      >
        {/* Top accent line */}
        <span className="accent-line-top" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 shrink-0">
          <div>
            <p className="font-mono text-[8px] tracking-[0.26em] text-[var(--foreground-muted)] uppercase mb-1">
              AI ASSISTANT
            </p>
            <h2
              id="ask-ai-title"
              className="text-sm font-bold tracking-[0.22em] text-[var(--foreground)] uppercase"
            >
              ASK THE CITY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close Ask AI panel"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase mb-2">
                Ask about the portfolio
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Examples: "What technologies are used here?" "Which projects use Spring Boot?"
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot--pulse" aria-hidden="true" />
              <span className="font-mono text-[10px] text-[var(--foreground-muted)] uppercase">
                Thinking...
              </span>
            </div>
          )}

          {error && (
            <p className="font-mono text-[10px] text-[var(--status-building)]">
              {error}
            </p>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border)] p-4 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the portfolio..."
              className="flex-1 px-3 py-2 border border-[var(--border)] bg-[var(--surface-muted)] font-mono text-[10px] tracking-[0.06em] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              disabled={isLoading}
              aria-label="Ask a question"
            />
            <SystemButton
              type="submit"
              variant="primary"
              disabled={!input.trim() || isLoading}
              aria-label="Submit question"
            >
              ASK
            </SystemButton>
          </form>
        </div>
      </aside>
    </>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[85%] border p-3 ${
          isUser
            ? "bg-[var(--surface-muted)] border-[var(--border)]"
            : "bg-[var(--surface)] border-[var(--border)]"
        }`}
      >
        <p className="font-mono text-[10px] tracking-[0.06em] text-[var(--foreground)] leading-relaxed">
          {message.content}
        </p>

        {!isUser && message.evidence && message.evidence.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
            <p className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase mb-2">
              Evidence
            </p>
            <ul className="space-y-1">
              {message.evidence.map((evidence, i) => (
                <li key={i} className="font-mono text-[9px] text-[var(--foreground-muted)]">
                  • {evidence}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isUser && message.confidence !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
              Confidence
            </span>
            <span className="font-mono text-[9px] font-semibold text-[var(--foreground)]">
              {Math.round(message.confidence * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
