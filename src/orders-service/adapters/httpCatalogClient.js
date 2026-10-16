import { CatalogClient } from '../application/ports/CatalogClient.js';

export class HttpCatalogClient extends CatalogClient {
  constructor(baseUrl, fetchImplementation = globalThis.fetch) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, '');
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
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'No se pudo reservar el inventario.');
    return result;
  }
}

export function createHttpCatalogClient(baseUrl) {
  return new HttpCatalogClient(baseUrl);
}
