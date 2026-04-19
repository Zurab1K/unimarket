/*
02-06-26
Brian Cao
Chat Bot Widget available globally.
*/
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your UniMarket assistant. Ask me for deal ideas, pricing tips, or help messaging buyers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (prompt: string) => {
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Chat backend error");
      }

      const data = (await response.json()) as { response?: string };
      const reply =
        data.response?.trim() || "I couldn't generate a reply just now.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStatus("idle");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || status === "sending") return;
    const prompt = input.trim();
    setInput("");
    await sendMessage(prompt);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[rgb(var(--brand-accent))] bg-[rgb(var(--brand-accent))] text-white shadow-[0_18px_40px_rgba(var(--brand-accent),0.28)] transition hover:brightness-95 active:scale-95"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          /* X icon */
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          /* Chat bubble icon */
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-[22rem] flex-col rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-white shadow-[0_24px_60px_rgba(127,29,29,0.16)]">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-[rgb(var(--brand-accent))] px-4 py-3 text-white">
            <div>
              <span className="text-sm font-semibold">UniMarket AI</span>
              <p className="text-xs text-white/75">Campus deals, pricing, and buyer help</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 transition hover:text-white"
              aria-label="Close chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white via-[rgba(var(--brand-accent),0.06)] to-[rgba(var(--brand-accent),0.09)] p-3">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={`${message.role}-${index}-${message.content.slice(0, 8)}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-[rgb(var(--brand-accent))] text-white shadow-[0_10px_24px_rgba(var(--brand-accent),0.18)]"
                        : "border border-[rgba(var(--brand-primary),0.18)] bg-white text-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            {status === "sending" && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] px-3 py-2 text-sm text-[rgb(var(--brand-primary))] shadow-sm">
                  Typing…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <p className="border-t border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] px-3 py-2 text-xs text-[rgb(var(--brand-primary))]">⚠️ {error}</p>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[rgba(var(--brand-primary),0.18)] bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-[rgba(var(--brand-accent),0.22)]"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-lg bg-[rgb(var(--brand-accent))] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-[rgba(var(--brand-accent),0.45)]"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
