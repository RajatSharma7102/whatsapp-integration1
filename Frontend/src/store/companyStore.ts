import { create } from 'zustand';
import api from '../lib/api';

type BotMode = 'BOT_ACTIVE' | 'HUMAN_ASSIGNED';

interface CompanyState {
  globalBotMode: BotMode;
  loading: boolean;
  setGlobalBotMode: (mode: BotMode) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  globalBotMode: 'BOT_ACTIVE',
  loading: false,

  setGlobalBotMode: async (mode: BotMode) => {
    const prev = get().globalBotMode;
    // Optimistically update UI
    set({ globalBotMode: mode, loading: true });
    try {
      // Bulk update ALL conversations for this company
      await api.patch('/conversations/bulk-bot-status', { botStatus: mode });
      set({ loading: false });
    } catch (error) {
      console.error('Failed to update global bot mode:', error);
      // Revert on error
      set({ globalBotMode: prev, loading: false });
    }
  },
}));
