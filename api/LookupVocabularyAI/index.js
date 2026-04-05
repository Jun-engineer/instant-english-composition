import { badRequest, jsonResponse, serverError } from '../shared/http.js';
import { getVocabCacheContainer } from '../shared/cosmos.js';

const SYSTEM_PROMPT = `You are a vocabulary assistant for Japanese learners of English.
Given an English word and the sentence it appears in, provide a clear, helpful vocabulary explanation.

Respond in JSON with this exact structure:
{
  "word": "<the word>",
  "partOfSpeech": "<part of speech in English, e.g. verb, noun, adjective>",
  "partOfSpeechJa": "<品詞 in Japanese, e.g. 動詞, 名詞, 形容詞>",
  "wordTranslation": "<concise Japanese word/phrase translation — just the word meaning, e.g. 安い, 走る, 美しい, より安い>",
  "definition": "<clear English definition, 1-2 sentences>,
  "definitionJa": "<Japanese translation of the definition above>",
  "usageExamples": [
    { "english": "<example sentence using the word>", "japanese": "<Japanese translation>" },
    { "english": "<another example>", "japanese": "<Japanese translation>" }
  ],
  "relatedWords": ["<synonym or related word 1>", "<synonym or related word 2>"],
  "notes": "<optional: brief grammar note, common usage pattern, or nuance explanation in Japanese. null if nothing notable>"
}

Rules:
- wordTranslation must be a short Japanese word or phrase (not a sentence). For "cheaper" → "より安い", for "run" → "走る", for "beautiful" → "美しい".
- definitionJa must be a natural Japanese translation of the English definition.
- Provide exactly 2 usage examples that are natural and appropriate for intermediate English learners.
- Keep definitions concise and clear.
- relatedWords should have 2-3 entries.
- notes should be in Japanese and explain nuances, collocations, or common mistakes. Set to null if the word is straightforward.`;

export default async function (context, req) {
  try {
    const word = (req.query?.word ?? '').trim().toLowerCase();
    const sentence = (req.query?.sentence ?? '').trim();

    if (!word) {
      badRequest(context, 'Query parameter "word" is required.');
      return;
    }

    // ── Check cache ──────────────────────────────────────────────
    const cacheContainer = getVocabCacheContainer();
    if (cacheContainer) {
      try {
        const { resource } = await cacheContainer.item(word, word).read();
        if (resource?.result) {
          jsonResponse(context, 200, {
            word,
            result: resource.result,
            available: true,
            source: 'cache'
          });
          return;
        }
      } catch (e) {
        // Cosmos SDK uses e.code as a number for HTTP status codes
        if (e.code !== 404) context.log.warn('Cache read error', e.code, e.message);
      }
    } else {
      context.log.warn('Vocab cache container unavailable — check COSMOS_* env vars');
    }

    // ── Call Azure OpenAI ────────────────────────────────────────
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'iec-gpt-4o-mini';

    if (!endpoint || !apiKey) {
      // Fallback: return empty so frontend uses Free Dictionary API
      jsonResponse(context, 200, { word, available: false, source: 'ai-unavailable' });
      return;
    }

    const userPrompt = sentence
      ? `Word: "${word}"\nSentence: "${sentence}"`
      : `Word: "${word}"`;

    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2025-01-01-preview`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      context.log.error(`Azure OpenAI error ${res.status}: ${errText}`);
      jsonResponse(context, 200, { word, available: false, source: 'ai-error' });
      return;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      jsonResponse(context, 200, { word, available: false, source: 'ai-empty' });
      return;
    }

    const parsed = JSON.parse(content);

    // ── Write to cache ───────────────────────────────────────────
    if (cacheContainer) {
      try {
        await cacheContainer.items.upsert({
          id: word,
          word,
          result: parsed,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        context.log.warn('Cache write error', e.message);
      }
    }

    jsonResponse(context, 200, {
      word,
      result: parsed,
      available: true,
      source: 'azure-openai'
    });
  } catch (error) {
    serverError(context, error);
  }
}
