import api from '../lib/api';

export const whatsappService = {
  sendMessage: async (leadId: string, message: string) => {
    const res = await api.post('/whatsapp/send', { leadId, message });
    return res.data.data;
  }
};
