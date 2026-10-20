import { CatalogClient } from '../application/ports/CatalogClient.js';

export class HttpCatalogClient extends CatalogClient {
  constructor(baseUrl, internalToken = '', fetchImplementation = globalThis.fetch) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.internalToken = internalToken;
    this.fetchImplementation = fetchImplementation;
  }

  async getProduct(productId) {
    const response = await this.fetchImplementation(
      `${this.baseUrl}/products/${encodeURIComponent(productId)}`,
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('No se pudo consultar el catálogo. Intenta de nuevo.');
    return response.json();
  }

  async reserveStock(items) {
    const response = await this.fetchImplementation(`${this.baseUrl}/reserve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-token': this.internalToken },
      body: JSON.stringify({ items }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'No se pudo reservar el inventario.');
    return result;
  }

  async releaseStock(items) {
    const response = await this.fetchImplementation(`${this.baseUrl}/release`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-token': this.internalToken },
      body: JSON.stringify({ items }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'No se pudo devolver el inventario.');
    return result;
  }
}

export function createHttpCatalogClient(baseUrl, internalToken) {
  return new HttpCatalogClient(baseUrl, internalToken);
}
