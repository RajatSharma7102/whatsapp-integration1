import api from '../lib/api';

export const whatsappService = {
  sendMessage: async (leadId: string, message: string) => {
    const res = await api.post('/whatsapp/send', { leadId, message });
    return res.data.data;
  },
  getAccounts: async () => {
    const res = await api.get('/whatsapp/accounts');
    return res.data.data.accounts;
  },
  connectAccount: async (data: any) => {
    const res = await api.post('/whatsapp/connect', data);
    return res.data.data.whatsappAccount;
  }
};
