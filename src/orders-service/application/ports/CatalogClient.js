export class CatalogClient {
  async getProduct() { throw new Error('CatalogClient.getProduct debe implementarse en un adaptador.'); }
  async reserveStock() { throw new Error('CatalogClient.reserveStock debe implementarse en un adaptador.'); }
  async releaseStock() { throw new Error('CatalogClient.releaseStock debe implementarse en un adaptador.'); }
}
