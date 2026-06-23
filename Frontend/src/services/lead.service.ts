import api from '../lib/api';
import { Lead } from '../types';

export const leadService = {
  getLeads: async (filters: Record<string, any> = {}) => {
    const res = await api.get('/leads', { params: filters });
    return res.data; // { data: Lead[], pagination: {...} }
  },
  getLeadById: async (id: string) => {
    const res = await api.get(`/leads/${id}`);
    return res.data.data;
  },
  createLead: async (data: Partial<Lead>) => {
    const res = await api.post('/leads', data);
    return res.data.data;
  },
  updateLead: async (id: string, data: Partial<Lead>) => {
    const res = await api.put(`/leads/${id}`, data);
    return res.data.data;
  }
};
