import type { DeckFilters, DeckCard, ReviewStatus } from './types';
import { API_ENDPOINTS } from './constants';

export interface MarkCardPayload {
  cardId: string;
  status: ReviewStatus;
}

export async function fetchCards(filters: DeckFilters): Promise<DeckCard[]> {
  const params = new URLSearchParams();
  if (filters.levels.length) {
    params.set('levels', filters.levels.join(','));
  }
  if (filters.tags.length) {
    params.set('tags', filters.tags.join(','));
  }
  if (Number.isFinite(filters.limit)) {
    params.set('limit', String(filters.limit));
  }

  const endpoint = params.toString()
    ? `${API_ENDPOINTS.getCards}?${params.toString()}`
    : API_ENDPOINTS.getCards;

  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch cards (${res.status}) via ${endpoint}`);
  }

  const data = (await res.json()) as { cards: DeckCard[] };
  return data.cards;
}

export async function markReviewResult(payload: MarkCardPayload) {
  const res = await fetch(API_ENDPOINTS.markCard, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Failed to mark card (${res.status})`);
  }

  return res.json();
}

export const fetcher = <T>(url: string) => fetch(url).then((response) => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json() as Promise<T>;
});
