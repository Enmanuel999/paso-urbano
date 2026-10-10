import { Cart } from '../domain/Cart.js';
import { Order } from '../domain/Order.js';

export function createOrderUseCases(repository, catalogUrl) {
  async function currentCatalogItem(productId, size, quantity) {
    const count = Cart.assertQuantity(quantity);
    const response = await fetch(`${catalogUrl}/products/${encodeURIComponent(productId)}`);
    if (!response.ok) throw new Error('Uno de los productos ya no está disponible.');
    const product = await response.json();
    const variant = product.variants.find((entry) => entry.size === String(size));
    if (!variant) throw new Error(`La talla ${size} no está disponible.`);
    if (Number(variant.stock) < count) throw new Error(`Solo quedan ${variant.stock} unidades de ${product.name}, talla ${size}.`);
    return { productId: product.id, name: product.name, brand: product.brand, image: product.image, size: variant.size, quantity: count, price: Number(product.price), unitPrice: Number(product.price) };
  }
  return {
    getCart(cartId) { Cart.assertId(cartId); return repository.getCart(cartId); },
    async setCartItem(cartId, input) {
      Cart.assertId(cartId);
      const item = await currentCatalogItem(input.productId, input.size, input.quantity);
      return repository.setCartItem(cartId, item);
    },
    removeCartItem(cartId, productId, size) { Cart.assertId(cartId); return repository.removeCartItem(cartId, productId, size); },
    async createOrder(input) {
      const { customerName, customerEmail, cartId } = input;
      Order.validateCustomer(customerName, customerEmail); Cart.assertId(cartId);
      const cart = await repository.getCart(cartId);
      if (!cart.items.length) throw new Error('Agrega productos al carrito antes de comprar.');
      const verified = [];
      for (const item of cart.items) verified.push(await currentCatalogItem(item.productId, item.size, item.quantity));
      const reservation = await fetch(`${catalogUrl}/reserve`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: verified.map(({ productId, size, quantity }) => ({ productId, size, quantity })) }),
      });
      const result = await reservation.json();
      if (!reservation.ok) throw new Error(result.error || 'No se pudo reservar el inventario.');
      return repository.create({ cartId, customerName: customerName.trim(), customerEmail: customerEmail.trim().toLowerCase(), items: verified });
    },
    getOrder: (id) => repository.findById(id),
  };
}
