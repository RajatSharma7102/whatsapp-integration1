import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useConversationStore } from './conversationStore';
import { useLeadStore } from './leadStore';
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
      const { activeConversationId, addMessage } = useConversationStore.getState();
      
      // If it's for the currently open chat, append it
      if (activeConversationId === payload.conversationId) {
        addMessage(payload.message);
      }
      
      // Update leads list unread count
      // This requires fetching or updating leadStore appropriately. 
      // A quick refetch or optimistic update works here.
      useLeadStore.getState().fetchLeads();
    });

    socket.on('message_status_update', (payload: { messageId: string, status: any, conversationId: string }) => {
      const { activeConversationId, updateMessageStatus } = useConversationStore.getState();
      if (activeConversationId === payload.conversationId) {
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
