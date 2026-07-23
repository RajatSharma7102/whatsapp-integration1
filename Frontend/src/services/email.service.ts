import api from '../lib/api';

export const emailService = {
  getAccounts: () => api.get('/email/accounts'),
  connectGmail: () => api.get('/email/connect/gmail'),
  disconnectAccount: (id: string) => api.delete(`/email/account/${id}`),
  
  syncEmails: () => api.post('/email/sync'),
  
  getConversations: (email?: string, limit = 20, cursor?: string) => 
    api.get(`/email/conversations?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}${email ? `&email=${encodeURIComponent(email)}` : ''}`),
    
  getMessages: (threadId: string, limit = 20, cursor?: string) => 
    api.get(`/email/conversations/${threadId}/messages?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`),
    
  sendEmail: (data: { to: string, subject: string, text?: string, html?: string, threadId?: string, conversationId?: string }) => 
    api.post('/email/send', data),
};
