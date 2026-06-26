import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useConversationStore } from './conversationStore';
import { useLeadStore } from './leadStore';
import { useCompanyStore } from './companyStore';
import { Lead, Message } from '../types';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    if (get().socket) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('new_message', (payload: { conversationId: string, leadId: string, lead: Lead, message: Message, isNewLead?: boolean }) => {
      const { activeConversation, addMessage } = useConversationStore.getState();
      
      // If it's for the currently open chat, append it
      if (activeConversation?._id === payload.conversationId) {
        addMessage(payload.message);
      }
      
      // Update leads list unread count
      // This requires fetching or updating leadStore appropriately. 
      // A quick refetch or optimistic update works here.
      useLeadStore.getState().fetchLeads();
    });

    socket.on('message_status_update', (payload: { messageId: string, status: any, conversationId: string }) => {
      const { activeConversation, updateMessageStatus } = useConversationStore.getState();
      if (activeConversation?._id === payload.conversationId) {
        updateMessageStatus(payload.messageId, payload.status);
      }
    });

    socket.on('lead_created', (payload: { lead: Lead }) => {
      useLeadStore.getState().addLead(payload.lead);
    });

    socket.on('conversation_updated', () => {
      // Optionally update conversation list/unread count
      useLeadStore.getState().fetchLeads();
    });

    socket.on('conversation_takeover', (payload: { conversationId: string, botStatus: string, assignedTo: any }) => {
      const { activeConversation, setActiveConversation } = useConversationStore.getState();
      const { activeLead } = useConversationStore.getState();
      if (activeConversation?._id === payload.conversationId) {
        setActiveConversation({ ...activeConversation, botStatus: payload.botStatus, assignedTo: payload.assignedTo }, activeLead);
      }
    });

    // Real-time: individual conversation bot status changed
    socket.on('conversation_bot_status_updated', (payload: { conversationId: string, botStatus: string, assignedTo: any }) => {
      const { activeConversation, setActiveConversation } = useConversationStore.getState();
      const { activeLead } = useConversationStore.getState();
      if (activeConversation?._id === payload.conversationId) {
        setActiveConversation({ ...activeConversation, botStatus: payload.botStatus, assignedTo: payload.assignedTo }, activeLead);
      }
    });

    // Real-time: global bot mode changed (broadcast to all tabs/agents)
    socket.on('global_bot_mode_updated', (payload: { companyId: string, globalBotMode: 'BOT_ACTIVE' | 'HUMAN_ASSIGNED' }) => {
      useCompanyStore.setState({ globalBotMode: payload.globalBotMode });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
