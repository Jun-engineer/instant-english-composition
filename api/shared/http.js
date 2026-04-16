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

function corsHeaders(context) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(context),
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

export function handleCorsPreflightIfNeeded(context, req) {
  if ((req.method ?? '').toUpperCase() === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        ...corsHeaders(context),
        'Access-Control-Max-Age': '86400',
      },
      body: null,
    };
    return true;
  }
  return false;
}

export function jsonResponse(context, status, body) {
  context.res = {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(context),
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
