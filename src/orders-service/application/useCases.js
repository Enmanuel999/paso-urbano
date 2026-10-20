import { Cart } from '../domain/Cart.js';
import { Order } from '../domain/Order.js';

function createVerifiedCartItem(product, productId, size, quantity) {
  const count = Cart.assertQuantity(quantity);
  if (!product) throw new Error('Uno de los productos ya no está disponible.');

  const variant = product.variants.find((entry) => entry.size === String(size));
  if (!variant) throw new Error(`La talla ${size} no está disponible.`);
  if (Number(variant.stock) < count) {
    throw new Error(`Solo quedan ${variant.stock} unidades de ${product.name}, talla ${size}.`);
  }

  return {
    productId: product.id || productId,
    name: product.name,
    brand: product.brand,
    image: product.image,
    size: variant.size,
    quantity: count,
    price: Number(product.price),
    unitPrice: Number(product.price),
  };
}

export function createCartUseCases({ cartRepository, catalogClient }) {
  async function verifyCartItem(input) {
    const product = await catalogClient.getProduct(input.productId);
    return createVerifiedCartItem(product, input.productId, input.size, input.quantity);
  }

  return {
    getCart(cartId) {
      Cart.assertId(cartId);
      return cartRepository.getCart(cartId);
    },
    async setCartItem(cartId, input) {
      Cart.assertId(cartId);
      const item = await verifyCartItem(input);
      return cartRepository.setCartItem(cartId, item);
    },
    removeCartItem(cartId, productId, size) {
      Cart.assertId(cartId);
      return cartRepository.removeCartItem(cartId, productId, size);
    },
  };
}

export function createOrderUseCases({ cartRepository, orderRepository, catalogClient }) {
  async function verifyCartItems(items) {
    const verifiedItems = [];
    for (const item of items) {
      const product = await catalogClient.getProduct(item.productId);
      verifiedItems.push(createVerifiedCartItem(product, item.productId, item.size, item.quantity));
    }
    return verifiedItems;
  }

  return {
    async createOrder(input) {
      const { customerName, customerEmail, cartId } = input;
      Order.validateCustomer(customerName, customerEmail);
      Cart.assertId(cartId);

      const cart = await cartRepository.getCart(cartId);
      if (!cart.items.length) throw new Error('Agrega productos al carrito antes de comprar.');

      const items = await verifyCartItems(cart.items);
      const reservation = items.map(({ productId, size, quantity }) => ({ productId, size, quantity }));
      await catalogClient.reserveStock(reservation);
      try {
        return await orderRepository.create({
          cartId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          items,
        });
      } catch (error) {
        try {
          await catalogClient.releaseStock(reservation);
        } catch {
          throw new Error('No se pudo guardar el pedido y el inventario reservado requiere revisión. Contacta al administrador.');
        }
        throw error;
      }
    },
    getOrder(id) {
      return orderRepository.findById(id);
    },
  };
}
