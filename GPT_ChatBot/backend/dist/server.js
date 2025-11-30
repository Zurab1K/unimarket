import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { OpenAI } from 'openai';
const PORT = Number(process.env.PORT ?? 5000);
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const promptSchema = z.object({
    prompt: z.string().min(1, 'Prompt text is required'),
});
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.post('/api/chat', async (req, res) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }
    const parseResult = promptSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.flatten() });
    }
    try {
        const response = await openai.responses.create({
            model: MODEL,
            input: parseResult.data.prompt,
            temperature: 0.7,
        });
        const text = extractText(response);
        res.json({ response: text });
    }
    catch (error) {
        console.error('OpenAI error', error);
        res.status(502).json({ error: 'Failed to contact OpenAI' });
    }
});
app.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}`);
});
function extractText(response) {
    if (typeof response !== 'object' ||
        response === null ||
        !Array.isArray(response.output)) {
        return '';
    }
    const segments = response.output;
    for (const segment of segments) {
        if (segment.type !== 'message') {
            continue;
        }
        for (const item of segment.content) {
            if (item.type === 'text') {
                return item.text;
            }
        }
    }
    return '';
}
//# sourceMappingURL=server.js.map