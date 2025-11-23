import type { VocabularyEntry, VocabularyMeaning, VocabularyDefinition } from './types';

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
        ? meaning.partOfSpeech.trim()
        : '—',
      definitions: mapDefinitions(Array.isArray(meaning?.definitions) ? meaning.definitions : [])
    }))
    .filter((meaning) => meaning.definitions.length)
    .slice(0, 4);
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
  const meanings = mapMeanings(Array.isArray(primary?.meanings) ? primary.meanings : []);
  if (!meanings.length) {
    throw new Error('No definition available');
  }

  return {
    word: typeof primary?.word === 'string' && primary.word.trim().length ? primary.word.trim() : normalized,
    phonetic: extractPhonetic(primary),
    audioUrl: extractAudio(primary),
    meanings
  };
}
