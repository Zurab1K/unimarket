import { NextResponse } from "next/server";

const DEFAULT_CHAT_API = "http://localhost:5050/api/chat";

function generateFallbackResponse(prompt: string): string {
  const normalized = prompt.trim().toLowerCase();

  if (
    normalized.includes("price") ||
    normalized.includes("pricing") ||
    normalized.includes("worth")
  ) {
    return "Try comparing 3 to 5 similar campus listings, then list about 10 to 15% above your minimum acceptable price so you have room to negotiate.";
  }

  if (
    normalized.includes("message") ||
    normalized.includes("buyer") ||
    normalized.includes("seller")
  ) {
    return 'Try this: "Hi! I’m interested in your item. Is it still available, and would you be free to meet on campus this week?"';
  }

  if (normalized.includes("safe") || normalized.includes("meet")) {
    return "Meet in a public campus location, inspect the item before paying, and avoid anyone who pressures you to send money in advance.";
  }

  return "The AI provider is temporarily unavailable, but I can still help with pricing, listing copy, meetup safety, and buyer or seller messages. Ask about a specific item or situation.";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const targetUrl = process.env.CHAT_API_URL?.trim() || DEFAULT_CHAT_API;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const message = errorJson?.error || `Chat backend returned ${response.status}`;
      return NextResponse.json({
        response: generateFallbackResponse(prompt),
        warning: message,
        mode: "fallback",
      });
    }

    const data = (await response.json()) as {
      response?: string;
      warning?: string;
      mode?: "gemini" | "fallback";
    };
    return NextResponse.json({
      response: data.response ?? generateFallbackResponse(prompt),
      warning: data.warning,
      mode: data.mode ?? "gemini",
    });
  } catch (error) {
    console.error("Chat proxy error", error);
    return NextResponse.json({
      response: generateFallbackResponse(prompt),
      warning: "Chat backend unavailable",
      mode: "fallback",
    });
  }
}
