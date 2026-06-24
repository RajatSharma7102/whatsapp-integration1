import api from '../lib/api';

export const authService = {
  register: async (companyName: string, name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { companyName, name, email, password });
    return res.data.data; // { user, token, company }
  },
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data; // { user, token }
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data;
  }
};
