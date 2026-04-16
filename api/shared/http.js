const ALLOWED_ORIGINS = [
  'https://speedspeak.jp',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'http://localhost:3000'
];

function getCorsOrigin(context) {
  const override = process.env.CORS_ALLOW_ORIGIN;
  if (override) return override;
  const reqOrigin = context.req?.headers?.origin ?? '';
  if (ALLOWED_ORIGINS.includes(reqOrigin)) return reqOrigin;
  return ALLOWED_ORIGINS[0];
}

export function jsonResponse(context, status, body) {
  context.res = {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': getCorsOrigin(context),
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
