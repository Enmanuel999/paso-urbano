export class UserRepository {
  async register() { throw new Error('UserRepository.register debe implementarse en un adaptador.'); }
  async login() { throw new Error('UserRepository.login debe implementarse en un adaptador.'); }
  async getUser() { throw new Error('UserRepository.getUser debe implementarse en un adaptador.'); }
}
