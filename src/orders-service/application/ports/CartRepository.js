export class CartRepository {
  async getCart() { throw new Error('CartRepository.getCart debe implementarse en un adaptador.'); }
  async setCartItem() { throw new Error('CartRepository.setCartItem debe implementarse en un adaptador.'); }
  async removeCartItem() { throw new Error('CartRepository.removeCartItem debe implementarse en un adaptador.'); }
}
