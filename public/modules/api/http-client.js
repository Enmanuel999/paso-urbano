const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error. Intenta de nuevo.';

export function createHttpClient(fetchImplementation = globalThis.fetch.bind(globalThis)) {
  return async function request(path, options = {}) {
    const { headers = {}, ...requestOptions } = options;
    const response = await fetchImplementation(`/api/${path}`, {
      ...requestOptions,
      headers: { 'content-type': 'application/json', ...headers },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || DEFAULT_ERROR_MESSAGE);
    }

    return payload;
  };
}
