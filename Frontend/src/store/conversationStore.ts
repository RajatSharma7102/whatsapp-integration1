import { create } from 'zustand';
import { Conversation, Message, Lead } from '../types';
import { conversationService } from '../services/conversation.service';
import { whatsappService } from '../services/whatsapp.service';

interface ConversationState {
  activeConversation: any | null;
  activeLead: Lead | null;
  messages: Message[];
  loadingMessages: boolean;
  sendingMessage: boolean;
  
  setActiveConversation: (conversation: any | null, lead: Lead | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (leadId: string, message: string) => Promise<void>;
  takeOverConversation: (conversationId: string) => Promise<void>;
  resumeBot: (conversationId: string) => Promise<void>;
  
  // Real-time mutations
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: any) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  activeConversation: null,
  activeLead: null,
  messages: [],
  loadingMessages: false,
  sendingMessage: false,

  setActiveConversation: (conversation, lead) => {
    set({ activeConversation: conversation, activeLead: lead });
    if (conversation) {
      get().fetchMessages(conversation._id);
    } else {
      set({ messages: [] });
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true });
    try {
      const response = await conversationService.getMessages(conversationId);
      set({ messages: response.data, loadingMessages: false });
    } catch (error) {
      set({ loadingMessages: false });
    }
  },

  sendMessage: async (leadId, messageText) => {
    set({ sendingMessage: true });
    try {
      const { message } = await whatsappService.sendMessage(leadId, messageText);
      // Wait for socket to broadcast, or optimistically append
      get().addMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      set({ sendingMessage: false });
    }
  },

  takeOverConversation: async (conversationId) => {
    try {
      const res = await conversationService.takeOver(conversationId);
      const updated = res.data?.conversation || res.data || res;
      set({ activeConversation: updated });
    } catch (error) {
      console.error('Failed to take over conversation:', error);
    }
  },

  resumeBot: async (conversationId) => {
    try {
      const res = await conversationService.resumeBot(conversationId);
      const updated = res.data?.conversation || res.data || res;
      set({ activeConversation: updated });
    } catch (error) {
      console.error('Failed to resume bot:', error);
    }
  },

  addMessage: (message) => {
    set((state) => {
      // Prevent duplicates if already added optimistically or by socket
      if (state.messages.some(m => m._id === message._id)) return state;
      return { messages: [...state.messages, message] };
    });
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map(m => 
        m.messageId === messageId ? { ...m, status } : m
      )
    }));
  }
}));
