import { API_ENDPOINTS } from './constants';
import type {
  VocabularyEntry,
  VocabularyMeaning,
  VocabularyDefinition,
  VocabularyUsageExample
} from './types';

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

function normalizeWord(raw: string): string {
  return raw.trim().toLowerCase();
}

function extractPhonetic(payload: any): string | undefined {
  if (typeof payload?.phonetic === 'string' && payload.phonetic.trim().length) {
    return payload.phonetic.trim();
  }
  const phonetics = Array.isArray(payload?.phonetics) ? payload.phonetics : [];
  const match = phonetics.find((item: any) => typeof item?.text === 'string' && item.text.trim().length);
  return match?.text?.trim();
}

function extractAudio(payload: any): string | undefined {
  const phonetics = Array.isArray(payload?.phonetics) ? payload.phonetics : [];
  const match = phonetics.find((item: any) => typeof item?.audio === 'string' && item.audio.trim().length);
  return match?.audio?.trim();
}

const PART_OF_SPEECH_MAP: Record<string, string> = {
  noun: '名詞',
  verb: '動詞',
  adjective: '形容詞',
  adverb: '副詞',
  pronoun: '代名詞',
  preposition: '前置詞',
  conjunction: '接続詞',
  interjection: '感動詞',
  article: '冠詞',
  determiner: '限定詞'
};

function translatePartOfSpeech(en: string, ja?: string): string {
  if (ja) return `${ja} / ${en}`;
  const mapped = PART_OF_SPEECH_MAP[en.toLowerCase()];
  return mapped ? `${mapped} / ${en}` : en;
}

/* ── AI Lookup (primary) ──────────────────────────────────────────── */

interface AIResult {
  word: string;
  partOfSpeech: string;
  partOfSpeechJa: string;
  wordTranslation: string;
  definition: string;
  definitionJa: string;
  usageExamples: Array<{ english: string; japanese?: string }>;
  relatedWords: string[];
  notes: string | null;
}

async function fetchAILookup(word: string, sentence: string): Promise<AIResult | null> {
  try {
    const params = new URLSearchParams({ word });
    if (sentence) params.set('sentence', sentence);
    const response = await fetch(`${API_ENDPOINTS.lookupVocabularyAI}?${params}`, {
      cache: 'no-store'
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload?.available || !payload?.result) return null;
    return payload.result as AIResult;
  } catch (error) {
    console.warn('AI vocabulary lookup failed', error);
    return null;
  }
}

function buildEntryFromAI(
  ai: AIResult,
  phonetic?: string,
  audioUrl?: string
): VocabularyEntry {
  const meanings: VocabularyMeaning[] = [
    {
      partOfSpeech: translatePartOfSpeech(ai.partOfSpeech, ai.partOfSpeechJa),
      definitions: [
        {
          definition: ai.definition,
          definitionJa: ai.definitionJa,
          translation: ai.wordTranslation
        }
      ]
    }
  ];

  const usageExamples: VocabularyUsageExample[] = (ai.usageExamples ?? [])
    .filter((ex) => ex.english)
    .map((ex) => ({ english: ex.english, japanese: ex.japanese }));

  return {
    word: ai.word || '',
    phonetic,
    audioUrl,
    meanings,
    usageExamples: usageExamples.length ? usageExamples : undefined,
    relatedWords: ai.relatedWords?.length ? ai.relatedWords : undefined,
    notes: ai.notes || undefined,
    source: 'ai'
  };
}

/* ── Free Dictionary API (phonetics + fallback) ───────────────────── */

function mapDefinitions(rawDefinitions: any[]): VocabularyDefinition[] {
  return rawDefinitions
    .filter((item) => typeof item?.definition === 'string' && item.definition.trim().length)
    .slice(0, 4)
    .map((item) => ({
      definition: item.definition.trim(),
      example: typeof item?.example === 'string' && item.example.trim().length ? item.example.trim() : undefined
    }));
}

function mapMeanings(rawMeanings: any[]): VocabularyMeaning[] {
  return rawMeanings
    .map((meaning) => ({
      partOfSpeech: typeof meaning?.partOfSpeech === 'string' && meaning.partOfSpeech.trim().length
        ? translatePartOfSpeech(meaning.partOfSpeech)
        : '品詞未分類',
      definitions: mapDefinitions(Array.isArray(meaning?.definitions) ? meaning.definitions : [])
    }))
    .filter((meaning) => meaning.definitions.length)
    .slice(0, 4);
}

async function fetchFreeDictionary(word: string) {
  try {
    const response = await fetch(`${DICTIONARY_API_BASE}${encodeURIComponent(word)}`);
    if (!response.ok) return null;
    const payload = await response.json();
    if (!Array.isArray(payload) || !payload.length) return null;
    return payload[0];
  } catch {
    return null;
  }
}

/* ── Main entry point ─────────────────────────────────────────────── */

export async function fetchVocabularyEntry(
  word: string,
  sentence?: string
): Promise<VocabularyEntry> {
  const normalized = normalizeWord(word);
  if (!normalized) {
    throw new Error('Word is required');
  }

  // Fetch AI lookup and Free Dictionary in parallel
  const [aiResult, freeDictPayload] = await Promise.all([
    fetchAILookup(normalized, sentence ?? ''),
    fetchFreeDictionary(normalized)
  ]);

  const phonetic = extractPhonetic(freeDictPayload);
  const audioUrl = extractAudio(freeDictPayload);

  // Primary: AI-powered lookup
  if (aiResult) {
    return buildEntryFromAI(aiResult, phonetic, audioUrl);
  }

  // Fallback: Free Dictionary API meanings
  const rawMeanings = Array.isArray(freeDictPayload?.meanings) ? freeDictPayload.meanings : [];
  const fallbackMeanings = mapMeanings(rawMeanings);

  if (!fallbackMeanings.length) {
    throw new Error('定義を取得できませんでした。');
  }

  return {
    word: freeDictPayload?.word?.trim() || normalized,
    phonetic,
    audioUrl,
    meanings: fallbackMeanings,
    source: 'dictionary'
  };
}
