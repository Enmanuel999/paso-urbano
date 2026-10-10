export class Cart {
  static assertId(id) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''))) throw new Error('Identificador de bolsa inválido.');
  }
  static assertQuantity(quantity) {
    const value = Number(quantity);
    if (!Number.isInteger(value) || value < 1 || value > 10) throw new Error('La cantidad debe estar entre 1 y 10.');
    return value;
  }
}
