import { create } from 'zustand';
import { Lead } from '../types';
import { leadService } from '../services/lead.service';

interface LeadState {
  leads: Lead[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  search: string;
  statusFilter: string;
  teamFilter: string;

  setFilters: (filters: { search?: string; status?: string; page?: number; teamId?: string }) => void;
  setTeamFilter: (teamId: string) => void;
  fetchLeads: () => Promise<void>;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  total: 0,
  loading: false,
  error: null,
  page: 1,
  limit: 20,
  search: '',
  statusFilter: '',
  teamFilter: '',

  setFilters: (filters) => {
    set({ ...filters, page: filters.page ?? 1 });
    get().fetchLeads();
  },

  setTeamFilter: (teamId: string) => {
    set({ teamFilter: teamId, page: 1 });
    get().fetchLeads();
  },

  fetchLeads: async () => {
    set({ loading: true, error: null });
    try {
      const { page, limit, search, statusFilter, teamFilter } = get();
      const response = await leadService.getLeads({ 
        page, 
        limit, 
        search, 
        status: statusFilter || undefined,
        teamId: teamFilter || undefined,
      });
      set({ 
        leads: response.data, 
        total: response.pagination.total, 
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch leads', loading: false });
    }
  },

  addLead: (lead) => {
    set((state) => ({ 
      leads: [lead, ...state.leads],
      total: state.total + 1
    }));
  },

  updateLead: (id, updates) => {
    set((state) => ({
      leads: state.leads.map((l) => (l._id === id ? { ...l, ...updates } : l)),
    }));
  },
}));
