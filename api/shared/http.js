export function jsonResponse(context, status, body) {
  context.res = {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    },
    body: JSON.stringify(body)
  };
}

export function badRequest(context, message) {
  jsonResponse(context, 400, { error: message });
}

export function serverError(context, error) {
  context.log.error(error);
  jsonResponse(context, 500, { error: 'Internal server error' });
}
