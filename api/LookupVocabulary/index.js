import { lookupJapaneseMeanings } from '../shared/jmdictSearch.js';
import { badRequest, jsonResponse, serverError } from '../shared/http.js';

export default async function (context, req) {
  try {
    const word = (req.query?.word ?? req.body?.word ?? '').trim();
    if (!word) {
      badRequest(context, 'Query parameter "word" is required.');
      return;
    }

    const { matches, source } = await lookupJapaneseMeanings(word);
    jsonResponse(context, 200, {
      word,
      matches,
      source,
      available: matches.length > 0
    });
  } catch (error) {
    serverError(context, error);
  }
}
