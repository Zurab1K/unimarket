import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { es } from 'zod/locales';

const PORT = Number(process.env.PORT ?? 5000);
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const promptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required here'),
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/chat', async (req: Request, res: Response) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Did not find an OPENAI_API_KEY' });
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
  } catch (error) {
    console.error('OpenAI error', error);
    res.status(502).json({ error: 'Failed to contact OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
});

function extractText(response: unknown): string {
  if (
    typeof response !== 'object' ||
    response === null ||
    !Array.isArray((response as { output?: unknown }).output)
  ) {
    return '';
  }

  const segments = (response as { output: Array<any> }).output;
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

