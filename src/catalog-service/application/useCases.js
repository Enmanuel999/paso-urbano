import { Product } from '../domain/Product.js';
export function createCatalogUseCases(repository) {
  return {
    listProducts: (filters) => repository.list(filters), getProduct: (id) => repository.findById(id),
    reserveStock: (items) => repository.reserve(items), releaseStock: (items) => repository.release(items),
    listAllProducts: () => repository.listAll(),
    saveProduct: (input) => repository.save(new Product(input)),
    setProductActive: (id, active) => repository.setActive(id, active),
  };
}
