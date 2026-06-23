import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('crm_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
}

// ─── Leads ───────────────────────────────────────────
export interface LeadFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  source?: string
}

export const leadsAPI = {
  getLeads: (filters: LeadFilters = {}) =>
    api.get('/leads', { params: filters }),
  getLeadById: (id: string) =>
    api.get(`/leads/${id}`),
  createLead: (data: Record<string, unknown>) =>
    api.post('/leads', data),
  updateLead: (id: string, data: Record<string, unknown>) =>
    api.put(`/leads/${id}`, data),
  deleteLead: (id: string) =>
    api.delete(`/leads/${id}`),
}

// ─── Conversations ────────────────────────────────────
export const conversationsAPI = {
  getConversations: (params: { page?: number; limit?: number; search?: string } = {}) =>
    api.get('/conversations', { params }),
  getMessages: (conversationId: string, params: { page?: number; limit?: number } = {}) =>
    api.get(`/conversations/${conversationId}/messages`, { params }),
}

// ─── WhatsApp ─────────────────────────────────────────
export const whatsappAPI = {
  sendMessage: (leadId: string, message: string) =>
    api.post('/whatsapp/send', { leadId, message }),
}

export default api
