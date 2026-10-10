export class Order {
  static validateCustomer(name, email) {
    if (typeof name !== 'string' || name.trim().length < 2) throw new Error('Escribe el nombre de quien recibe el pedido.');
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Escribe un correo válido.');
  }
  static totalFor(items) {
    if (!Array.isArray(items) || items.length === 0) throw new Error('El pedido necesita al menos un artículo.');
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity), unitPrice = Number(item.unitPrice);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10 || !Number.isSafeInteger(unitPrice) || unitPrice < 1) throw new Error('Hay un artículo inválido en el pedido.');
      return sum + quantity * unitPrice;
    }, 0);
    return subtotal + (subtotal >= 350000 ? 0 : 14000);
  }
}
