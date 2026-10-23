import { Admin } from '../domain/Admin.js';
export function createAdminUseCases(repository) {
  return {
    configure: (username, password) => repository.configure(username, password),
    login: (credentials) => repository.login(Admin.validateCredentials(credentials)),
    profile: (token) => repository.getSession(token), logout: (token) => repository.logout(token),
  };
}
