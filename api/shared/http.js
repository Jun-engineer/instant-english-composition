export function jsonResponse(context, status, body) {
  context.res = {
    status,
    headers: {
      'Content-Type': 'application/json'
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
