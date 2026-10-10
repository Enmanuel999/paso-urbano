import { ShoeVariant } from './ShoeVariant.js';

export class Product {
  constructor({ id, name, brand, category, description, price, image, variants = [] }) {
    if (typeof id !== 'string' || !id.trim()) throw new Error('El producto requiere un identificador.');
    if (typeof name !== 'string' || name.trim().length < 2) throw new Error('El producto requiere un nombre válido.');
    if (!Number.isSafeInteger(Number(price)) || Number(price) < 1) throw new Error('El precio debe ser un entero positivo en COP.');
    Object.assign(this, { id, name, brand, category, description, price: Number(price), image, variants: variants.map((variant) => new ShoeVariant({ productId: id, ...variant })) });
  }
}
