import "dotenv/config";
import cors from "cors";
import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { GoogleGenAI } from '@google/genai';

const PORT = Number(process.env.PORT ?? 5050);
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

// Load the Gemini SDK'
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("MISSING GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey: apiKey });

const promptSchema = z.object({
  prompt: z.string().min(1, "Prompt is required here"),
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Did not find an GEMINI_API_KEY" });
  }

  const parseResult = promptSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  try {
    const userPrompt = parseResult.data.prompt;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction:
          "You are a helpful assistant for a campus marketplace called UniMarket",
        temperature: 0.7,
      },
    });

    res.json({ response: response.text ?? "" });
  } catch (error: unknown) {
    console.error("GeminiAI error", error);
    const message =
      error instanceof Error ? error.message : "Failed to connect to Gemini";
    res.status(502).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
});
