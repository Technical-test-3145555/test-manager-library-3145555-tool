/** Minimal client for the Manager Library API. Everything the seeder does goes through here. */

export class ApiError extends Error {
  constructor(status, body, method, path) {
    super(`${method} ${path} answered ${status} ${body?.code ?? ''} ${body?.message ?? ''}`.trim());
    this.status = status;
    this.body = body;
  }
}

export function createClient(baseUrl) {
  async function request(method, path, { body, token, allow = [] } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : null;

    if (!response.ok && !allow.includes(response.status)) {
      throw new ApiError(response.status, json, method, path);
    }

    return { status: response.status, json };
  }

  return {
    request,
    get: (path, token) => request('GET', path, { token }),
    post: (path, body, token, allow) => request('POST', path, { body, token, allow }),

    async login(username, password) {
      const { json } = await request('POST', '/auth/login', { body: { username, password } });
      return json.access_token;
    },
  };
}
