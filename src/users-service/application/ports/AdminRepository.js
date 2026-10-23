export class AdminRepository {
  async configure() { throw new Error('AdminRepository.configure debe implementarse en un adaptador.'); }
  async login() { throw new Error('AdminRepository.login debe implementarse en un adaptador.'); }
  async getSession() { throw new Error('AdminRepository.getSession debe implementarse en un adaptador.'); }
  async logout() { throw new Error('AdminRepository.logout debe implementarse en un adaptador.'); }
}
