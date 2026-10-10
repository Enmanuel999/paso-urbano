export class ShoeVariant {
  constructor({ productId, size, stock }) {
    const parsedSize = Number(size), parsedStock = Number(stock);
    if (!productId || !Number.isInteger(parsedSize) || parsedSize < 20 || parsedSize > 60) throw new Error('La variante requiere un producto y una talla válida.');
    if (!Number.isInteger(parsedStock) || parsedStock < 0) throw new Error('El inventario no puede ser negativo.');
    this.productId = productId; this.size = String(parsedSize); this.stock = parsedStock;
  }
  canFulfill(quantity) { return Number.isInteger(quantity) && quantity > 0 && this.stock >= quantity; }
}
