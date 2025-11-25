#!/usr/bin/env node

import { createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import http from 'node:http';
import { promisify } from 'node:util';
import { gunzip as gunzipCallback } from 'node:zlib';
import crypto from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'api', 'shared', 'data');
const outputPath = path.join(dataDir, 'jmdict.min.json');
const downloadPath = path.join(projectRoot, '.tmp-jmdict.gz');

const DOWNLOAD_URL = 'https://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz';
const MAX_RESULTS_PER_KEY = 24;
const gunzip = promisify(gunzipCallback);
const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'there',
  'this',
  'to',
  'with'
]);

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const fileStream = createWriteStream(destination);
    const urlObject = new URL(url);
    const options = {
      hostname: urlObject.hostname,
      path: `${urlObject.pathname}${urlObject.search}`,
      protocol: urlObject.protocol,
      checkServerIdentity: () => undefined
    };
    const client = urlObject.protocol === 'http:' ? http : https;
    const request = client.get(options, (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        response.resume();
        return;
      }
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });
    });
    request.on('error', (error) => {
      reject(error);
    });
  });
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanGloss(gloss) {
  if (!gloss) return '';
  let text = gloss;
  text = text.replace(/[()（）\[\]]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function collectKeywords(glossText) {
  const keywords = new Set();
  const cleaned = cleanGloss(glossText);
  if (!cleaned) return keywords;
  const normalized = normalizeKey(cleaned);
  if (normalized) {
    keywords.add(normalized);
    if (normalized.startsWith('to ')) {
      keywords.add(normalized.slice(3));
    }
    normalized
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !STOPWORDS.has(token))
      .forEach((token) => keywords.add(token));
  }
  cleaned
    .split(/[;,]/)
    .map((part) => normalizeKey(part))
    .filter(Boolean)
    .forEach((part) => {
      keywords.add(part);
      part
        .split(' ')
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !STOPWORDS.has(token))
        .forEach((token) => keywords.add(token));
    });
  return keywords;
}

async function parseDictionary(buffer) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text'
  });
  const parsed = parser.parse(buffer);
  const entries = toArray(parsed?.JMdict?.entry);
  log(`Parsed ${entries.length} entries from JMdict.`);

  const formattedEntries = [];
  const englishIndex = new Map();
  const exactIndex = new Map();

  entries.forEach((entry, index) => {
    const kanji = toArray(entry?.k_ele).flatMap((item) => (item?.keb ? [item.keb] : []));
    const kana = toArray(entry?.r_ele).flatMap((item) => (item?.reb ? [item.reb] : []));
    const senses = toArray(entry?.sense)
      .map((sense) => {
        const glosses = toArray(sense?.gloss)
          .map((gloss) => {
            if (typeof gloss === 'string') {
              return gloss.trim();
            }
            if (gloss && typeof gloss === 'object') {
              return (gloss['#text'] ?? '').trim();
            }
            return '';
          })
          .filter(Boolean);

        const englishGlosses = toArray(sense?.gloss)
          .map((gloss) => {
            if (typeof gloss === 'string') {
              return { lang: 'eng', text: gloss.trim() };
            }
            if (gloss && typeof gloss === 'object') {
              const text = (gloss['#text'] ?? '').trim();
              const lang = gloss['@_xml:lang'] ?? 'eng';
              return { lang, text };
            }
            return null;
          })
          .filter((item) => item && item.text && (!item.lang || item.lang === 'eng'))
          .map((item) => item.text)
          .filter(Boolean);

        const partsOfSpeech = toArray(sense?.pos).filter(Boolean);
        if (!glosses.length) {
          return null;
        }
        return {
          glosses,
          englishGlosses,
          partsOfSpeech
        };
      })
      .filter(Boolean);

    if (!senses.length) {
      return;
    }

    const entryRecord = {
      id: String(entry?.ent_seq ?? index),
      kanji,
      kana,
      senses: senses.map((sense) => ({
        glosses: sense.glosses,
        partsOfSpeech: sense.partsOfSpeech
      }))
    };

    const entryIndex = formattedEntries.length;
    formattedEntries.push(entryRecord);

    const keywords = new Set();
    const exactKeywords = new Set();
    senses.forEach((sense) => {
      sense.englishGlosses.forEach((gloss) => {
        const normalizedGloss = normalizeKey(gloss);
        if (normalizedGloss) {
          exactKeywords.add(normalizedGloss);
        }
        collectKeywords(gloss).forEach((keyword) => keywords.add(keyword));
      });
    });

    keywords.forEach((keyword) => {
      if (!keyword) return;
      if (!englishIndex.has(keyword)) {
        englishIndex.set(keyword, []);
      }
      const bucket = englishIndex.get(keyword);
      if (bucket.length < MAX_RESULTS_PER_KEY) {
        bucket.push(entryIndex);
      }
    });

    exactKeywords.forEach((keyword) => {
      if (!keyword) return;
      if (!exactIndex.has(keyword)) {
        exactIndex.set(keyword, new Set());
      }
      const bucket = exactIndex.get(keyword);
      if (bucket.size < MAX_RESULTS_PER_KEY) {
        bucket.add(entryIndex);
      }
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    entryCount: formattedEntries.length,
    checksum: crypto
      .createHash('sha256')
      .update(JSON.stringify({ size: formattedEntries.length }))
      .digest('hex')
      .slice(0, 16),
    entries: formattedEntries,
    englishIndex: Object.fromEntries(englishIndex.entries()),
    exactIndex: Object.fromEntries(
      Array.from(exactIndex.entries()).map(([keyword, set]) => [keyword, Array.from(set)])
    )
  };
}

async function main() {
  const force = process.argv.includes('--force');
  await ensureDataDir();
  if (!force) {
    try {
      await fs.access(outputPath);
      log(`Existing JMdict JSON found at ${outputPath}. Use --force to regenerate.`);
      return;
    } catch (error) {
      // continue
    }
  }

  log(`Downloading JMdict from ${DOWNLOAD_URL} ...`);
  await downloadFile(DOWNLOAD_URL, downloadPath);
  log('Download complete. Parsing...');

  const gzBuffer = await fs.readFile(downloadPath);
  const xmlBuffer = await gunzip(gzBuffer);
  const dictionary = await parseDictionary(xmlBuffer.toString('utf-8'));

  await fs.writeFile(outputPath, JSON.stringify(dictionary));
  log(`JMdict dataset saved to ${outputPath} (entries: ${dictionary.entryCount}).`);
  await fs.unlink(downloadPath).catch(() => {});
}

main().catch((error) => {
  console.error('Failed to prepare JMdict dataset:', error);
  process.exitCode = 1;
});
