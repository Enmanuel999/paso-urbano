import { createHttpClient } from './http-client.js';

const request = createHttpClient();

export const ordersApi = {
  getCart(cartId) {
    return request(`orders/carts/${encodeURIComponent(cartId)}`);
  },
  setCartItem(cartId, item) {
    return request(`orders/carts/${encodeURIComponent(cartId)}/items`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },
  removeCartItem(cartId, productId, size) {
    const path = `orders/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(productId)}/${encodeURIComponent(size)}`;
    return request(path, { method: 'DELETE' });
  },
  createOrder(order) {
    return request('orders', { method: 'POST', body: JSON.stringify(order) });
  },
};
