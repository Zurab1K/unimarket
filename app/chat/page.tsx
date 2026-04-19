"use client";

import { FormEvent, useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Chat() {
  const ready = useAuthGuard();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I’m your UniMarket assistant. Ask me for deal ideas, pricing tips, or help messaging buyers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);

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
      const reply = data.response?.trim() || "I couldn't generate a reply just now.";
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

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[rgba(var(--brand-accent),0.12)] to-white px-4 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-[rgb(var(--brand-primary))]">AI Assistant</p>
          <h1 className="text-3xl font-bold text-gray-900">Chat with UniMarket</h1>
          <p className="text-sm text-gray-600">
            Powered by your chatbot backend (set CHAT_API_URL to match). Ask anything about listings,
            pricing, or campus meetups.
          </p>
        </header>

        <section className="rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-white p-4 shadow-lg">
          <div className="flex h-[55vh] flex-col gap-4 overflow-y-auto rounded-xl bg-gradient-to-b from-white to-[rgba(var(--brand-accent),0.06)] p-4">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={`${message.role}-${index}-${message.content.slice(0, 8)}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-[rgb(var(--brand-accent))] text-white"
                        : "bg-white text-gray-800 border border-[rgba(var(--brand-primary),0.18)]"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-3 text-sm text-[rgb(var(--brand-primary))]">
              ⚠️ {error} — ensure the chatbot backend is running and CHAT_API_URL points to it.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              placeholder="Ask for pricing advice, safe meetups, or write a friendly buyer message..."
              className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-[rgba(var(--brand-accent),0.22)]"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="min-w-[130px] rounded-xl bg-[rgb(var(--brand-accent))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-[rgba(var(--brand-accent),0.45)]"
            >
              {status === "sending" ? "Sending..." : "Send"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
