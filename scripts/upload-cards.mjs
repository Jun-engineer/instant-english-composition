/**
 * upload-cards.mjs
 *
 * Uploads generated cards to Cosmos DB, or appends to local customCards.json.
 *
 * Usage:
 *   node scripts/upload-cards.mjs scripts/output/cards-B1-2026-04-04T12-00-00.json
 *   node scripts/upload-cards.mjs --local scripts/output/cards-B1-2026-04-04T12-00-00.json
 *
 * For Cosmos DB upload, set in .env:
 *   COSMOS_ENDPOINT
 *   COSMOS_KEY
 *   COSMOS_DATABASE  (default: iec)
 *   COSMOS_CONTAINER (default: cards)
 *
 * --local flag: skip Cosmos DB, append to api/shared/customCards.json instead.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, fileURLToPath } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
}

/* ── CLI ──────────────────────────────────────────────────────────── */

function parseArgs() {
  const args = process.argv.slice(2);
  let local = false;
  let filePath = null;

  for (const arg of args) {
    if (arg === '--local') {
      local = true;
    } else if (!arg.startsWith('-')) {
      filePath = arg;
    }
  }

  if (!filePath) {
    console.error('Usage: node scripts/upload-cards.mjs [--local] <path-to-cards.json>');
    process.exit(1);
  }

  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  return { local, filePath: absPath };
}

/* ── Local append ─────────────────────────────────────────────────── */

function appendToLocal(cards) {
  const customPath = resolve(__dirname, '..', 'api', 'shared', 'customCards.json');
  let existing = [];
  if (existsSync(customPath)) {
    existing = JSON.parse(readFileSync(customPath, 'utf-8'));
  }

  const existingIds = new Set(existing.map((c) => c.id));
  const newCards = cards.filter((c) => !existingIds.has(c.id));
  const skipped = cards.length - newCards.length;

  if (skipped > 0) {
    console.log(`  Skipped ${skipped} duplicate card(s)`);
  }

  const merged = [...existing, ...newCards];
  writeFileSync(customPath, JSON.stringify(merged, null, 2));
  console.log(`✅ Appended ${newCards.length} cards to customCards.json (total: ${merged.length})`);
}

/* ── Cosmos DB upload ─────────────────────────────────────────────── */

async function uploadToCosmos(cards) {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  const databaseId = process.env.COSMOS_DATABASE || 'iec';
  const containerId = process.env.COSMOS_CONTAINER || 'cards';

  if (!endpoint || !key) {
    console.error('Missing COSMOS_ENDPOINT or COSMOS_KEY. Set them in .env.');
    console.error('Or use --local to append to customCards.json instead.');
    process.exit(1);
  }

  // Dynamic import so the script works even without @azure/cosmos installed
  let CosmosClient;
  try {
    const mod = await import('@azure/cosmos');
    CosmosClient = mod.CosmosClient;
  } catch {
    console.error('@azure/cosmos is not installed. Run: npm install @azure/cosmos');
    console.error('Or use --local to append to customCards.json instead.');
    process.exit(1);
  }

  const client = new CosmosClient({ endpoint, key });
  const container = client.database(databaseId).container(containerId);

  let success = 0;
  let failed = 0;

  for (const card of cards) {
    try {
      await container.items.upsert(card);
      success++;
      process.stdout.write(`\r  Uploaded ${success}/${cards.length}`);
    } catch (err) {
      failed++;
      console.error(`\n  Failed to upload ${card.id}: ${err.message}`);
    }
  }

  console.log(`\n✅ Uploaded ${success} cards to Cosmos DB (${failed} failed)`);
}

/* ── Main ─────────────────────────────────────────────────────────── */

async function main() {
  loadEnv();
  const { local, filePath } = parseArgs();

  const cards = JSON.parse(readFileSync(filePath, 'utf-8'));
  if (!Array.isArray(cards) || !cards.length) {
    console.error('No cards found in the input file.');
    process.exit(1);
  }

  console.log(`\n📤 Uploading ${cards.length} cards from ${filePath}`);

  if (local) {
    appendToLocal(cards);
  } else {
    await uploadToCosmos(cards);
  }
}

main();
