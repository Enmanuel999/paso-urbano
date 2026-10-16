import { createHttpClient } from './http-client.js';

const request = createHttpClient();

export const catalogApi = {
  listProducts(filters = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    return request(`products?${params}`);
  },
};
