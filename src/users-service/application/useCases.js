import { User } from '../domain/User.js';

export function createUserUseCases(repository) {
  return {
    register: (input) => repository.register(User.validateRegistration(input)),
    login: (input) => repository.login(input),
    profile: (token) => repository.getUser(token),
  };
}
