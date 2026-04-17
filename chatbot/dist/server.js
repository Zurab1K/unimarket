import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
const PORT = Number(process.env.PORT ?? 5050);
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
}
const ai = new GoogleGenAI({ apiKey });
const systemInstruction = "You are a helpful assistant for a campus marketplace called UniMarket.";
const promptSchema = z.object({
    prompt: z.string().trim().min(1, "Prompt is required"),
});
function normalizeGeminiError(error) {
    if (!(error instanceof Error)) {
        return { status: 502, message: "Failed to connect to Gemini" };
    }
    let payload = null;
    try {
        payload = JSON.parse(error.message);
    }
    catch {
        payload = null;
    }
    const statusCode = payload?.error?.code;
    const providerStatus = payload?.error?.status;
    const providerMessage = payload?.error?.message ?? error.message;
    if (statusCode === 429 ||
        providerStatus === "RESOURCE_EXHAUSTED" ||
        /quota exceeded/i.test(providerMessage)) {
        const retryMatch = providerMessage.match(/Please retry in ([\d.]+)s/i);
        const retryHint = retryMatch ? ` Retry in about ${Math.ceil(Number(retryMatch[1]))} seconds.` : "";
        return {
            status: 429,
            message: "Gemini quota is unavailable for this project or has been exceeded." +
                retryHint +
                " Check your Gemini API rate limits, billing, and project configuration.",
        };
    }
    if (statusCode === 401 || statusCode === 403) {
        return {
            status: statusCode,
            message: "Gemini rejected the API key or project configuration.",
        };
    }
    if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 600) {
        return { status: statusCode, message: providerMessage };
    }
    return { status: 502, message: providerMessage || "Failed to connect to Gemini" };
}
const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.post("/api/chat", async (req, res) => {
    const parseResult = promptSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.flatten() });
        return;
    }
    try {
        const userPrompt = parseResult.data.prompt;
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: userPrompt,
            config: {
                systemInstruction,
                temperature: 0.7,
            },
        });
        res.json({ response: response.text ?? "" });
    }
    catch (error) {
        console.error("Gemini error", error);
        const normalized = normalizeGeminiError(error);
        res.status(normalized.status).json({ error: normalized.message });
    }
});
app.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map