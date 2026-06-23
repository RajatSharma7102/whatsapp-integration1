import api from '../lib/api';

export const conversationService = {
  getConversations: async (filters: Record<string, any> = {}) => {
    const res = await api.get('/conversations', { params: filters });
    return res.data;
  },
  getByLead: async (leadId: string) => {
    const res = await api.get(`/conversations/lead/${leadId}`);
    return res.data;
  },
  getMessages: async (conversationId: string, page = 1, limit = 50) => {
    const res = await api.get(`/conversations/${conversationId}/messages`, { params: { page, limit } });
    return res.data;
  },
  takeOver: async (conversationId: string) => {
    const res = await api.patch(`/conversations/${conversationId}/takeover`);
    return res.data;
  }
};
