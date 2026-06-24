import { create } from 'zustand';
import { WhatsAppAccount } from '../types';
import { whatsappService } from '../services/whatsapp.service';

interface WhatsAppState {
  accounts: WhatsAppAccount[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  connectAccount: (data: any) => Promise<void>;
}

export const useWhatsAppStore = create<WhatsAppState>((set) => ({
  accounts: [],
  isLoading: false,
  error: null,
  
  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await whatsappService.getAccounts();
      set({ accounts, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  connectAccount: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newAccount = await whatsappService.connectAccount(data);
      set((state) => ({ accounts: [newAccount, ...state.accounts], isLoading: false }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  }
}));
