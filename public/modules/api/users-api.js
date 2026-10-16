import { createHttpClient } from './http-client.js';

const request = createHttpClient();

export const usersApi = {
  register(credentials) {
    return request('users/register', { method: 'POST', body: JSON.stringify(credentials) });
  },
  login(credentials) {
    return request('users/login', { method: 'POST', body: JSON.stringify(credentials) });
  },
};
