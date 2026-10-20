export function createCatalogUseCases(repository) {
  return {
    listProducts: (filters) => repository.list(filters),
    getProduct: (id) => repository.findById(id),
    reserveStock: (items) => repository.reserve(items),
    releaseStock: (items) => repository.release(items),
  };
}
