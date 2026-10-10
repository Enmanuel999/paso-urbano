export class CatalogRepository {
  async list() { throw new Error('CatalogRepository.list debe implementarse en un adaptador.'); }
  async findById() { throw new Error('CatalogRepository.findById debe implementarse en un adaptador.'); }
  async reserve() { throw new Error('CatalogRepository.reserve debe implementarse en un adaptador.'); }
}
