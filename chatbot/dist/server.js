import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
const PORT = Number(process.env.PORT ?? 5050);
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const systemInstruction = [
    "You are UniMarket Assistant, a specialized helper for a student marketplace.",
    "Focus on practical marketplace tasks: pricing estimates, listing rewrites, buyer/seller message drafts, and meetup safety.",
    "Keep suggestions concise, actionable, and campus-oriented.",
    "When giving drafts, provide copy the user can paste directly.",
].join(" ");
const promptSchema = z.object({
    prompt: z.string().trim().min(1, "Prompt is required"),
    intent: z
        .enum([
        "general",
        "price_help",
        "rewrite_listing",
        "message_draft",
        "summarize_listing",
        "safety_advice",
    ])
        .optional()
        .default("general"),
    listingContext: z
        .object({
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        location: z.string().optional(),
        condition: z.string().optional(),
    })
        .nullable()
        .optional(),
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
function generateFallbackResponse(prompt, intent) {
    const normalized = prompt.trim().toLowerCase();
    if (intent === "summarize_listing") {
        return "Listing summary fallback: focus on item type, condition, price, and pickup area; call out any missing details before reserving.";
    }
    if (normalized.includes("price") ||
        normalized.includes("pricing") ||
        normalized.includes("how much") ||
        normalized.includes("worth")) {
        return [
            "UniMarket fallback assistant:",
            "1. Check 3 to 5 similar campus listings and start about 10 to 15% above your minimum acceptable price.",
            "2. Price fast-moving basics like mini fridges, desks, and textbooks more aggressively if you need a quick sale.",
            "3. Mention condition, age, accessories, and meetup location in the listing so buyers trust the price.",
            "4. If you want, send me the item name, condition, and original price and I can suggest a tighter price range.",
        ].join("\n");
    }
    if (normalized.includes("message") ||
        normalized.includes("buyer") ||
        normalized.includes("seller") ||
        normalized.includes("reply")) {
        return [
            "UniMarket fallback assistant:",
            "Try this message:",
            '"Hi! I’m interested in your item. Is it still available, and would you be free to meet on campus this week? If yes, what time works best for you?"',
            "If you are the seller, keep replies short: confirm availability, suggest 2 meetup windows, and restate the price.",
        ].join("\n");
    }
    if (normalized.includes("safe") ||
        normalized.includes("scam") ||
        normalized.includes("meet") ||
        normalized.includes("pickup")) {
        return [
            "UniMarket fallback assistant:",
            "Meet in a public campus location, avoid advance payments, inspect the item before sending money, and keep all deal details in writing.",
            "If the buyer or seller rushes you, asks to move off-platform immediately, or refuses a normal meetup, walk away.",
        ].join("\n");
    }
    if (normalized.includes("listing") ||
        normalized.includes("title") ||
        normalized.includes("description") ||
        normalized.includes("post")) {
        return [
            "UniMarket fallback assistant:",
            "A strong listing should include:",
            "- a specific title with brand, item type, and condition",
            "- 3 to 5 clear photos in good lighting",
            "- the actual condition and any flaws",
            "- pickup area and whether the price is negotiable",
            "If you paste your draft listing text, I can rewrite it for clarity.",
        ].join("\n");
    }
    return [
        "UniMarket fallback assistant:",
        "I can still help with pricing, listing copy, negotiation, buyer messages, and meetup safety even while the AI provider is unavailable.",
        "Tell me what item or situation you are dealing with, and I’ll give you a practical draft or checklist.",
    ].join("\n");
}
const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        mode: ai ? "gemini" : "fallback",
        providerConfigured: Boolean(apiKey),
    });
});
app.post("/api/chat", async (req, res) => {
    const parseResult = promptSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.flatten() });
        return;
    }
    try {
        const userPrompt = parseResult.data.prompt;
        const intent = parseResult.data.intent;
        const listingContext = parseResult.data.listingContext;
        const marketplaceContext = listingContext
            ? `\nListing context:\n${JSON.stringify(listingContext, null, 2)}`
            : "";
        const finalPrompt = `Intent: ${intent}\nUser request: ${userPrompt}${marketplaceContext}`;
        if (!ai) {
            res.json({
                response: generateFallbackResponse(userPrompt, intent),
                mode: "fallback",
                warning: "Gemini API key is not configured. Returning a local fallback response.",
            });
            return;
        }
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: finalPrompt,
            config: {
                systemInstruction,
                temperature: 0.7,
            },
        });
        res.json({ response: response.text ?? "", mode: "gemini" });
    }
    catch (error) {
        console.error("Gemini error", error);
        const normalized = normalizeGeminiError(error);
        res.json({
            response: generateFallbackResponse(parseResult.data.prompt, parseResult.data.intent),
            mode: "fallback",
            warning: normalized.message,
        });
    }
});
app.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map