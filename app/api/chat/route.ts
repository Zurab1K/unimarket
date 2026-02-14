import { NextResponse } from "next/server";

const DEFAULT_CHAT_API = "http://localhost:5050/api/chat";

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
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = (await response.json()) as { response?: string };
    return NextResponse.json({ response: data.response ?? "" });
  } catch (error) {
    console.error("Chat proxy error", error);
    return NextResponse.json({ error: "Chat backend unavailable" }, { status: 502 });
  }
}
