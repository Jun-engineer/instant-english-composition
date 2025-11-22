import { getCosmosContainer } from '../shared/cosmos.js';
import { sampleCards } from '../shared/sampleCards.js';
import { jsonResponse, serverError } from '../shared/http.js';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

function resolveLimit(rawLimit) {
  if (typeof rawLimit !== 'number' || Number.isNaN(rawLimit)) {
    return DEFAULT_LIMIT;
  }
  const clamped = Math.min(Math.max(Math.round(rawLimit), 0), MAX_LIMIT);
  return clamped === 0 ? DEFAULT_LIMIT : clamped;
}

async function fetchFromCosmos(filters, limit) {
  const container = getCosmosContainer();
  if (!container) {
    return null;
  }

  const parameters = [];
  let query = 'SELECT TOP @limit c.id, c.prompt, c.answer, c.cefrLevel, c.tags, c.hint FROM c';
  parameters.push({ name: '@limit', value: limit });

  const conditions = [];
  if (filters.levels.length) {
    parameters.push({ name: '@levels', value: filters.levels });
    conditions.push('ARRAY_CONTAINS(@levels, c.cefrLevel)');
  }
  if (filters.tags.length) {
    parameters.push({ name: '@tags', value: filters.tags });
    conditions.push('ARRAY_LENGTH(ARRAY_INTERSECT(c.tags, @tags)) > 0');
  }

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ' ORDER BY c._ts DESC';

  const iterator = container.items.query({ query, parameters });
  const { resources } = await iterator.fetchAll();
  return resources;
}

export default async function (context, req) {
  try {
    const levelsParam = req.query?.levels ?? '';
    const tagsParam = req.query?.tags ?? '';
    const limitParam = req.query?.limit;
    const parsedLimit = typeof limitParam === 'string' ? Number.parseInt(limitParam, 10) : Number.NaN;
    const limit = resolveLimit(parsedLimit);
    const filters = {
      levels: levelsParam ? levelsParam.split(',').filter(Boolean) : [],
      tags: tagsParam ? tagsParam.split(',').filter(Boolean) : []
    };

    const cosmosCards = await fetchFromCosmos(filters, limit);
    const cards = cosmosCards && cosmosCards.length
      ? cosmosCards
      : sampleCards.filter((card) => {
          const levelMatch = !filters.levels.length || filters.levels.includes(card.cefrLevel);
          const tagMatch = !filters.tags.length || card.tags.some((tag) => filters.tags.includes(tag));
          return levelMatch && tagMatch;
        }).slice(0, limit);

    jsonResponse(context, 200, { cards });
  } catch (error) {
    serverError(context, error);
  }
}
