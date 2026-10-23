import { ShoeVariant } from './ShoeVariant.js';

function isValidImageSource(source) {
  if (typeof source !== 'string' || !source || source.length > 255 || /\s/.test(source)) return false;
  if (source.startsWith('/images/shoes/')) return /^\/images\/shoes\/[a-zA-Z0-9._/-]+$/.test(source) && !source.includes('..');
  try {
    const url = new URL(source);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && Boolean(url.hostname);
  } catch { return false; }
}

export class Product {
  constructor({ id, name, brand, category, description, price, image, images = [], variants = [], active = true }) {
    if (typeof id !== 'string' || !/^[a-z0-9-]{2,60}$/.test(id)) throw new Error('Usa un identificador en minúsculas, números y guiones.');
    if (typeof name !== 'string' || name.trim().length < 2) throw new Error('El producto requiere un nombre válido.');
    if (!Number.isSafeInteger(Number(price)) || Number(price) < 1) throw new Error('El precio debe ser un entero positivo en COP.');
    if (typeof brand !== 'string' || !brand.trim()) throw new Error('La marca es obligatoria.');
    if (typeof category !== 'string' || !category.trim()) throw new Error('La categoría es obligatoria.');
    if (!['Urbano','Deportivo','Casual','Outdoor'].includes(category)) throw new Error('Selecciona una categoría válida.');
    if (typeof description !== 'string' || !description.trim()) throw new Error('La descripción es obligatoria.');
    if (!isValidImageSource(image)) throw new Error('La imagen principal debe ser una URL http(s) válida o una ruta local de /images/shoes/.');
    Object.assign(this, {
      id, name: name.trim(), brand: brand.trim(), category, description: description.trim(), price: Number(price), image, active: Boolean(active),
      images: images.map((item, i) => {
        const normalized = typeof item === 'string' ? { src: item, alt: name + ' — foto ' + (i + 2) } : item;
        if (!normalized || !isValidImageSource(normalized.src)) throw new Error('Cada foto adicional debe ser una URL http(s) válida o una ruta local de /images/shoes/.');
        return normalized;
      }),
      variants: variants.map((v) => new ShoeVariant({ productId: id, ...v })),
    });
  }
}