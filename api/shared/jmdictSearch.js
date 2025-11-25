import { getJMDict } from './jmdict.js';

function normalizeKey(value) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^a-z0-9\s'-]/g, '')
    .trim();
}

function generateVariants(word) {
  const normalized = normalizeKey(word);
  const variants = new Set();
  const pushVariant = (value) => {
    if (typeof value !== 'string') {
      return;
    }
    const candidate = value.trim();
    if (candidate) {
      variants.add(candidate);
    }
  };

  const isConsonant = (char) => /[bcdfghjklmnpqrstvwxyz]/.test(char);

  pushVariant(normalized);

  if (normalized.length > 4 && normalized.endsWith('ies')) {
    pushVariant(`${normalized.slice(0, -3)}y`);
  }

  if (normalized.length > 4 && normalized.endsWith('ves')) {
    pushVariant(`${normalized.slice(0, -3)}f`);
    pushVariant(`${normalized.slice(0, -3)}fe`);
  }

  if (normalized.length > 3 && normalized.endsWith('es')) {
    pushVariant(normalized.slice(0, -2));
  }

  if (normalized.length > 2 && normalized.endsWith('s')) {
    pushVariant(normalized.slice(0, -1));
  }

  if (normalized.length > 4 && normalized.endsWith('ing')) {
    const stem = normalized.slice(0, -3);
    pushVariant(stem);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2] && isConsonant(stem[stem.length - 1])) {
      pushVariant(stem.slice(0, -1));
    }
    if (stem.length > 1 && isConsonant(stem[stem.length - 1])) {
      pushVariant(`${stem}e`);
    }
  }

  if (normalized.length > 3 && normalized.endsWith('ed')) {
    const stem = normalized.slice(0, -2);
    pushVariant(stem);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2] && isConsonant(stem[stem.length - 1])) {
      pushVariant(stem.slice(0, -1));
    }
    if (stem.length > 1 && isConsonant(stem[stem.length - 1])) {
      pushVariant(`${stem}e`);
    }
  }

  return Array.from(variants);
}

export async function lookupJapaneseMeanings(word, options = {}) {
  const dictionary = await getJMDict();
  if (!dictionary) {
    return { matches: [], source: null };
  }

  const limit = typeof options.limit === 'number' && options.limit > 0 ? Math.min(options.limit, 10) : 5;
  const variants = generateVariants(word);
  const baseQuery = normalizeKey(word);
  const candidates = new Map();

  for (const variant of variants) {
    const combinedIndices = new Set();
    const exactIndices = Array.isArray(dictionary.exactIndex?.[variant]) ? dictionary.exactIndex[variant] : [];
    exactIndices.forEach((index) => combinedIndices.add(index));
    const indices = dictionary.englishIndex?.[variant];
    if (Array.isArray(indices)) {
      indices.forEach((index) => combinedIndices.add(index));
    }
    if (!combinedIndices.size) {
      continue;
    }
    for (const index of combinedIndices) {
      const entry = dictionary.entries?.[index];
      if (!entry) {
        continue;
      }
      let bestSenseIndex = -1;
      let bestSenseScore = 0;
      let bestSense = null;
      let hasExactMatch = false;

      entry.senses?.forEach((sense, senseIndex) => {
        if (!sense || !Array.isArray(sense.glosses) || !sense.glosses.length) {
          return;
        }
        let senseScore = 0;
        const senseWeight = Math.max(1, 4 - senseIndex);
        sense.glosses.forEach((gloss, glossIndex) => {
          const normalizedGloss = normalizeKey(gloss);
          if (!normalizedGloss) {
            return;
          }
          const glossWeight = Math.max(1, 6 - glossIndex);
          const variantInfinitive = `to ${variant}`;
          const baseInfinitive = baseQuery ? `to ${baseQuery}` : null;
          const glossEqualsVariant = normalizedGloss === variant;
          const glossEqualsBase = baseQuery && normalizedGloss === baseQuery;
          const glossEqualsVariantInf = normalizedGloss === variantInfinitive;
          const glossEqualsBaseInf = baseInfinitive && normalizedGloss === baseInfinitive;
          const isExactVariant = glossEqualsVariant || glossEqualsVariantInf;
          const isExactBase = Boolean(glossEqualsBase || glossEqualsBaseInf);
          if (glossEqualsVariant || glossEqualsVariantInf) {
            senseScore += 12 * senseWeight * glossWeight;
          }
          if (glossEqualsBase || glossEqualsBaseInf) {
            senseScore += 10 * senseWeight * glossWeight;
          }
          if (isExactVariant || isExactBase) {
            hasExactMatch = true;
          }
          if (variant && normalizedGloss.includes(variant)) {
            senseScore += 6 * senseWeight * glossWeight;
          }
          if (baseQuery && normalizedGloss.includes(baseQuery)) {
            senseScore += 5 * senseWeight * glossWeight;
          }
          const tokens = normalizedGloss.split(' ').filter(Boolean);
          if (tokens.includes(variant)) {
            senseScore += 3 * senseWeight * glossWeight;
          }
          if (baseQuery && tokens.includes(baseQuery)) {
            senseScore += 2 * senseWeight * glossWeight;
          }
        });
        if (senseScore > bestSenseScore) {
          bestSenseScore = senseScore;
          bestSenseIndex = senseIndex;
          bestSense = sense;
        }
      });

      if (!bestSense || bestSenseScore <= 0) {
        continue;
      }

      const existing = candidates.get(entry.id);
      const updatedScore = (existing?.score ?? 0) + bestSenseScore;
      const isNewBestSense = bestSenseScore >= (existing?.bestSenseScore ?? 0);
      const nextRecord = {
        entry,
        score: updatedScore,
        bestSense: isNewBestSense ? bestSense : existing?.bestSense ?? bestSense,
        bestSenseScore: Math.max(bestSenseScore, existing?.bestSenseScore ?? 0),
        bestSenseIndex: isNewBestSense
          ? bestSenseIndex
          : existing?.bestSenseIndex ?? bestSenseIndex,
        hasExactMatch: (existing?.hasExactMatch ?? false) || hasExactMatch
      };
      candidates.set(entry.id, nextRecord);
    }
  }

  const ranked = Array.from(candidates.values())
    .filter((candidate) => candidate.bestSense && candidate.bestSenseScore > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.bestSenseIndex !== b.bestSenseIndex) {
        return a.bestSenseIndex - b.bestSenseIndex;
      }
      return (a.entry.id > b.entry.id ? 1 : -1);
    })
    .map((candidate) => ({
      entryId: candidate.entry.id,
      headword: candidate.entry.kanji?.[0] ?? candidate.entry.kana?.[0] ?? '',
      reading: candidate.entry.kana?.[0] ?? null,
      glosses: candidate.bestSense.glosses.slice(0, 5),
      partsOfSpeech: Array.isArray(candidate.bestSense.partsOfSpeech)
        ? candidate.bestSense.partsOfSpeech
        : [],
      hasExactMatch: candidate.hasExactMatch
    }));

  const exactMatches = ranked.filter((match) => match.hasExactMatch);
  const preferred = exactMatches.length ? exactMatches : ranked;

  return {
    matches: preferred.slice(0, limit).map(({ hasExactMatch: _drop, ...rest }) => rest),
    source: {
      entryCount: dictionary.entryCount ?? dictionary.entries?.length ?? null,
      generatedAt: dictionary.generatedAt ?? null
    }
  };
}
