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

const PART_OF_SPEECH_RULES: Array<{ test: (value: string) => boolean; label: string }> = [
  { test: (value) => /particle/i.test(value), label: '助詞' },
  { test: (value) => /pronoun/i.test(value), label: '代名詞' },
  { test: (value) => /conjunction/i.test(value), label: '接続詞' },
  { test: (value) => /interjection/i.test(value), label: '感動詞' },
  { test: (value) => /adverb/i.test(value), label: '副詞' },
  { test: (value) => /adjective/i.test(value), label: '形容詞' },
  { test: (value) => /verb.*ichidan/i.test(value), label: '一段動詞' },
  { test: (value) => /verb.*godan/i.test(value), label: '五段動詞' },
  { test: (value) => /verb/i.test(value), label: '動詞' },
  { test: (value) => /noun.*proper/i.test(value), label: '固有名詞' },
  { test: (value) => /noun/i.test(value), label: '名詞' },
  { test: (value) => /expressions? \(phrases/i.test(value), label: '慣用句' },
  { test: (value) => /auxiliary/i.test(value), label: '助動詞' },
  { test: (value) => /suffix/i.test(value), label: '接尾辞' },
  { test: (value) => /prefix/i.test(value), label: '接頭辞' }
];

function translatePartOfSpeech(value: string): string {
  const normalized = value.trim();
  const match = PART_OF_SPEECH_RULES.find((rule) => rule.test(normalized));
  if (!match) {
    return normalized || '品詞未分類';
  }
  return `${match.label} / ${normalized}`;
}

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectExamples(rawMeanings: any[], lookupWords: string[]): VocabularyUsageExample[] {
  const examples = new Map<string, VocabularyUsageExample>();
  const normalizedTargets = Array.from(
    new Set(
      lookupWords
        .map((word) => (typeof word === 'string' ? word.trim().toLowerCase() : ''))
        .filter(Boolean)
    )
  );
  const patterns = normalizedTargets.map((word) => new RegExp(`\b${escapeRegExp(word)}\b`, 'i'));
  rawMeanings.forEach((meaning) => {
    const definitions = Array.isArray(meaning?.definitions) ? meaning.definitions : [];
    definitions.forEach((definition) => {
      if (typeof definition?.example === 'string' && definition.example.trim().length) {
        const english = definition.example.trim();
        if (patterns.length && !patterns.some((pattern) => pattern.test(english))) {
          return;
        }
        if (!examples.has(english)) {
          examples.set(english, { english });
        }
      }
    });
  });
  return Array.from(examples.values()).slice(0, 5);
}

async function fetchJapaneseMeanings(word: string) {
  try {
    const response = await fetch(`${API_ENDPOINTS.lookupVocabulary}?word=${encodeURIComponent(word)}`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    if (!Array.isArray(payload?.matches)) {
      return [];
    }
    return payload.matches as Array<{
      entryId: string;
      headword: string;
      reading: string | null;
      glosses: string[];
      partsOfSpeech: string[];
    }>;
  } catch (error) {
    console.warn('Failed to fetch JMdict meanings', error);
    return [];
  }
}

function formatJapaneseHeadword(match: { headword?: string; reading?: string | null }): string {
  const headword = match.headword?.trim() ?? '';
  const reading = match.reading?.trim() ?? '';
  if (headword && reading && headword !== reading) {
    return `${headword}（${reading}）`;
  }
  return headword || reading || '—';
}

function buildMeaningsFromJMDict(matches: Array<{
  glosses: string[];
  partsOfSpeech: string[];
  headword?: string;
  reading?: string | null;
}>): VocabularyMeaning[] {
  return matches.map((match) => ({
    partOfSpeech: match.partsOfSpeech?.length
      ? match.partsOfSpeech.map(translatePartOfSpeech).join('、')
      : '品詞未分類',
    definitions: [
      {
        definition: formatJapaneseHeadword(match),
        translation: (match.glosses ?? []).slice(0, 5).join(' / ') || undefined
      }
    ]
  }));
}

export async function fetchVocabularyEntry(word: string): Promise<VocabularyEntry> {
  const normalized = normalizeWord(word);
  if (!normalized) {
    throw new Error('Word is required');
  }

  const response = await fetch(`${DICTIONARY_API_BASE}${encodeURIComponent(normalized)}`);
  if (!response.ok) {
    throw new Error(`Failed to load definition (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || !payload.length) {
    throw new Error('No definition available');
  }

  const primary = payload[0];
  const rawMeanings = Array.isArray(primary?.meanings) ? primary.meanings : [];
  const resolvedWord = typeof primary?.word === 'string' && primary.word.trim().length ? primary.word.trim() : normalized;

  let japaneseMatches = await fetchJapaneseMeanings(normalized);
  const normalizedResolved = normalizeWord(resolvedWord);
  if (!japaneseMatches.length && normalizedResolved !== normalized) {
    japaneseMatches = await fetchJapaneseMeanings(normalizedResolved);
  }

  const combinedMeanings = japaneseMatches.length
    ? buildMeaningsFromJMDict(japaneseMatches)
    : mapMeanings(rawMeanings);

  if (!combinedMeanings.length) {
    throw new Error('No definition available');
  }

  const usageExamples = collectExamples(rawMeanings, [normalized, normalizedResolved]);

  return {
    word: resolvedWord,
    phonetic: extractPhonetic(primary),
    audioUrl: extractAudio(primary),
    meanings: combinedMeanings,
    usageExamples: usageExamples.length ? usageExamples : undefined
  };
}
