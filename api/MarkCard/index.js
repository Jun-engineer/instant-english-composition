import { v4 as uuidv4 } from 'uuid';
import { getCosmosContainer } from '../shared/cosmos.js';
import { jsonResponse, badRequest, serverError, handleCorsPreflightIfNeeded } from '../shared/http.js';

export default async function (context, req) {
  if (handleCorsPreflightIfNeeded(context, req)) return;
  try {
    const body = req.body ?? {};
    const { cardId, status } = body;

    if (!cardId || !status) {
      badRequest(context, 'cardId と status は必須です');
      return;
    }

    const container = getCosmosContainer();

    if (container) {
      await container.items.create({
        id: uuidv4(),
        cardId,
        status,
        timestamp: new Date().toISOString()
      });
    }

    jsonResponse(context, 200, { ok: true });
  } catch (error) {
    serverError(context, error);
  }
}
