/**
 * generate-cards.mjs
 *
 * Generates flashcard sentence pairs using Azure OpenAI (GPT-4o mini).
 *
 * Usage:
 *   node scripts/generate-cards.mjs --level B1 --tags "travel,daily-life" --count 20
 *   node scripts/generate-cards.mjs --level A1 --count 50 --tags "food,hobby"
 *
 * Environment variables (set in .env or export):
 *   AZURE_OPENAI_ENDPOINT  — e.g. https://your-resource.openai.azure.com
 *   AZURE_OPENAI_API_KEY   — your API key
 *   AZURE_OPENAI_DEPLOYMENT — deployment name (e.g. gpt-4o-mini)
 *
 * Output: writes to scripts/output/cards-{level}-{timestamp}.json
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ── CLI args ─────────────────────────────────────────────────────── */

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { level: 'B1', tags: ['daily-life'], count: 20 };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--level' && args[i + 1]) {
      parsed.level = args[++i].toUpperCase();
    } else if (args[i] === '--tags' && args[i + 1]) {
      parsed.tags = args[++i].split(',').map((t) => t.trim());
    } else if (args[i] === '--count' && args[i + 1]) {
      parsed.count = Math.min(Math.max(parseInt(args[++i], 10), 1), 100);
    }
  }

  const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  if (!validLevels.includes(parsed.level)) {
    console.error(`Invalid level: ${parsed.level}. Must be one of: ${validLevels.join(', ')}`);
    process.exit(1);
  }

  return parsed;
}

/* ── Env ──────────────────────────────────────────────────────────── */

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

  if (!endpoint || !apiKey) {
    console.error('Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY.');
    console.error('Set them in .env or export them as environment variables.');
    process.exit(1);
  }

  return { endpoint, apiKey, deployment };
}

/* ── Existing ID check ────────────────────────────────────────────── */

function loadExistingIds() {
  const ids = new Set();
  // Load IDs from customCards.json
  const customPath = resolve(__dirname, '..', 'api', 'shared', 'customCards.json');
  if (existsSync(customPath)) {
    const cards = JSON.parse(readFileSync(customPath, 'utf-8'));
    cards.forEach((c) => ids.add(c.id));
  }
  // Load IDs from any previously generated output files
  const outputDir = resolve(__dirname, 'output');
  if (existsSync(outputDir)) {
    for (const f of readdirSync(outputDir)) {
      if (f.endsWith('.json')) {
        try {
          const data = JSON.parse(readFileSync(resolve(outputDir, f), 'utf-8'));
          if (Array.isArray(data)) data.forEach((c) => ids.add(c.id));
        } catch { /* skip */ }
      }
    }
  }
  return ids;
}

/* ── Azure OpenAI call ────────────────────────────────────────────── */

async function callAzureOpenAI({ endpoint, apiKey, deployment }, prompt) {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2025-01-01-preview`;

  const body = {
    messages: [
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 4096,
    response_format: { type: 'json_object' }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Azure OpenAI error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Azure OpenAI');

  const parsed = JSON.parse(content);
  return parsed.cards || parsed;
}

/* ── Prompts ──────────────────────────────────────────────────────── */

function systemPrompt() {
  return `You are an expert English-Japanese bilingual educator who creates flashcard content for "瞬間英作文" (instant English composition) training.

Your task is to generate high-quality Japanese→English sentence pairs.

Rules:
- The Japanese sentence (prompt) must be natural Japanese, NOT a literal word-for-word translation of the English.
- The English sentence (answer) must use grammar and vocabulary appropriate for the specified CEFR level.
- Each sentence pair should be unique and cover different vocabulary/grammar patterns.
- The hint field should contain 2-3 key English words or phrases that help the learner construct the sentence.
- Vary sentence structures: statements, questions, negatives, conditionals, etc.
- Keep sentences practical and useful for real-life communication.
- Do not repeat the same sentence pattern.

CEFR level guidelines:
- A1: Simple present, basic vocabulary, very short sentences (5-8 words)
- A2: Past tense, comparatives, compound sentences (8-12 words)
- B1: Perfect tenses, modals, relative clauses (10-15 words)
- B2: Passive voice, conditionals, complex sentences (12-18 words)
- C1: Subjunctive, nuanced expressions, idiomatic phrases (15-22 words)
- C2: Sophisticated structures, subtle distinctions, near-native complexity (18-25 words)

Output format: Return JSON with a "cards" array.`;
}

function userPrompt(level, tags, count) {
  return `Generate ${count} flashcard sentence pairs.

CEFR Level: ${level}
Tags/Topics: ${tags.join(', ')}

Return as JSON:
{
  "cards": [
    {
      "prompt": "Japanese sentence here",
      "answer": "English sentence here",
      "cefrLevel": "${level}",
      "tags": ${JSON.stringify(tags)},
      "hint": "key / English / words"
    }
  ]
}

Generate exactly ${count} cards. Every card must have all fields.`;
}

/* ── ID generation ────────────────────────────────────────────────── */

function generateId(level, index, existingIds) {
  const ts = Date.now().toString(36);
  let id;
  let attempt = 0;
  do {
    id = `ai-${level.toLowerCase()}-${ts}-${String(index + attempt).padStart(3, '0')}`;
    attempt++;
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}

/* ── Validation ───────────────────────────────────────────────────── */

function validateCards(cards, level) {
  const valid = [];
  for (const card of cards) {
    if (!card.prompt || !card.answer || !card.cefrLevel || !Array.isArray(card.tags)) {
      console.warn('  Skipping card with missing fields:', JSON.stringify(card).slice(0, 80));
      continue;
    }
    if (card.cefrLevel !== level) {
      card.cefrLevel = level;
    }
    if (!card.hint) {
      card.hint = '';
    }
    valid.push(card);
  }
  return valid;
}

/* ── Main ─────────────────────────────────────────────────────────── */

async function main() {
  const { level, tags, count } = parseArgs();
  const env = loadEnv();

  console.log(`\n🎴 Generating ${count} cards — Level: ${level}, Tags: ${tags.join(', ')}`);
  console.log(`   Using: ${env.endpoint} / ${env.deployment}\n`);

  // Generate in batches of 20 to stay within token limits
  const batchSize = 20;
  const batches = Math.ceil(count / batchSize);
  let allCards = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = Math.min(batchSize, count - allCards.length);
    console.log(`   Batch ${i + 1}/${batches}: requesting ${batchCount} cards...`);

    try {
      const raw = await callAzureOpenAI(env, userPrompt(level, tags, batchCount));
      const cards = Array.isArray(raw) ? raw : [raw];
      const validated = validateCards(cards, level);
      allCards = allCards.concat(validated);
      console.log(`   ✓ Received ${validated.length} valid cards`);
    } catch (err) {
      console.error(`   ✗ Batch ${i + 1} failed: ${err.message}`);
    }

    // Small delay between batches
    if (i < batches - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!allCards.length) {
    console.error('\nNo cards generated. Check your Azure OpenAI configuration.');
    process.exit(1);
  }

  // Load existing IDs and assign unique IDs
  const existingIds = await loadExistingIds();
  allCards = allCards.map((card, i) => ({
    id: generateId(level, i, existingIds),
    ...card
  }));

  // Write output
  const outputDir = resolve(__dirname, 'output');
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = resolve(outputDir, `cards-${level}-${timestamp}.json`);
  writeFileSync(outputPath, JSON.stringify(allCards, null, 2));

  console.log(`\n✅ Generated ${allCards.length} cards → ${outputPath}`);
  console.log('\nNext steps:');
  console.log('  1. Review the generated cards in the output file');
  console.log('  2. Upload to Cosmos DB: node scripts/upload-cards.mjs ' + outputPath);
  console.log('  3. Or append to customCards.json: node scripts/upload-cards.mjs --local ' + outputPath);
}

main();
