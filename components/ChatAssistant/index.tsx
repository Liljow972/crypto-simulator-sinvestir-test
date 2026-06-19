"use client";

import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

const WELCOME_PROMPTS = [
  "Comment fonctionne le DCA ?",
  "Comment lire les résultats ?",
  "Quelle crypto choisir pour débuter ?",
];

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas à chaque nouveau token.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isOpen]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const history = [...messages, userMessage];

    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok || !response.body) {
        throw new Error("unavailable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: accumulated };
          return copy;
        });
      }
    } catch {
      // Le simulateur n'est jamais bloqué : on retire le placeholder vide
      // et on affiche un message de repli.
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.content === "") copy.pop();
        return copy;
      });
      setError("Assistant temporairement indisponible.");
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end max-sm:inset-x-4">
      {isOpen && (
        <div className="mb-3 flex h-[480px] w-full flex-col overflow-hidden rounded-card border border-si-border bg-si-card shadow-card sm:w-[360px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-si-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-si-blue/15 text-si-blue">
                <Bot size={16} />
              </span>
              <span className="font-display text-sm font-semibold text-white">
                Assistant S&apos;investir
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer l'assistant"
              className="text-si-muted transition-colors hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-si-muted">
                  Bonjour ! Je suis l&apos;assistant S&apos;investir. Comment
                  puis-je vous aider avec le simulateur ?
                </p>
                <div className="flex flex-col gap-2">
                  {WELCOME_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="rounded-full border border-si-border bg-si-input px-3 py-2 text-left text-sm text-white transition-colors hover:border-si-blue"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                role={message.role}
                content={message.content}
                streaming={
                  isStreaming &&
                  index === messages.length - 1 &&
                  message.role === "assistant"
                }
              />
            ))}

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-si-border p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Votre question…"
              className="flex-1 rounded-full border border-si-border bg-si-input px-4 py-2.5 text-sm text-white placeholder:text-si-muted/70 focus:border-si-blue focus:outline-none"
              aria-label="Votre question"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              aria-label="Envoyer"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-si-blue text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 self-end rounded-full bg-si-blue px-5 py-3 font-semibold text-white shadow-card transition-all duration-200 hover:scale-105 hover:bg-[#1d4ed8] active:scale-95"
        aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant S'investir"}
      >
        <Bot size={18} strokeWidth={2} />
        {!isOpen && <span className="text-sm font-semibold">Assistant</span>}
      </button>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: ChatRole;
  content: string;
  streaming: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
          isUser
            ? "bg-si-blue text-white"
            : "border border-si-border bg-si-input text-white"
        }`}
      >
        {content}
        {streaming && (
          <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-si-muted align-middle" />
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
