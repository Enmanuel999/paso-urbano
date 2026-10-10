export class OrdersRepository {
  async getCart() { throw new Error('OrdersRepository.getCart debe implementarse en un adaptador.'); }
  async setCartItem() { throw new Error('OrdersRepository.setCartItem debe implementarse en un adaptador.'); }
  async removeCartItem() { throw new Error('OrdersRepository.removeCartItem debe implementarse en un adaptador.'); }
  async create() { throw new Error('OrdersRepository.create debe implementarse en un adaptador.'); }
  async findById() { throw new Error('OrdersRepository.findById debe implementarse en un adaptador.'); }
}
