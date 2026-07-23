import { create } from 'zustand';
import { emailService } from '../services/email.service';

interface EmailConversation {
  _id: string;
  threadId: string;
  leadId: string;
  subject: string;
  participants: string[];
  lastMessageSnippet: string;
  unreadCount: number;
  lastMessageAt: string;
}

interface EmailMessage {
  _id: string;
  conversationId: string;
  threadId: string;
  sender: string;
  recipients: string[];
  subject: string;
  htmlBody: string;
  plainBody: string;
  direction: 'incoming' | 'outgoing';
  status: string;
  sentAt: string;
  attachments: any[];
}

interface EmailStore {
  conversations: EmailConversation[];
  loadingConversations: boolean;
  nextConversationCursor: string | null;
  
  messages: EmailMessage[];
  loadingMessages: boolean;
  nextMessageCursor: string | null;
  
  activeThreadId: string | null;
  
  fetchConversations: (email?: string, cursor?: string) => Promise<void>;
  fetchMessages: (threadId: string, cursor?: string) => Promise<void>;
  setActiveThread: (threadId: string | null) => void;
  syncEmails: () => Promise<void>;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  conversations: [],
  loadingConversations: false,
  nextConversationCursor: null,
  
  messages: [],
  loadingMessages: false,
  nextMessageCursor: null,
  
  activeThreadId: null,
  
  fetchConversations: async (email?: string, cursor?: string) => {
    set({ loadingConversations: true });
    try {
      const res = await emailService.getConversations(email, 20, cursor);
      if (cursor) {
        set((state) => ({ 
          conversations: [...state.conversations, ...res.data.data],
          nextConversationCursor: res.data.nextCursor
        }));
      } else {
        set({ 
          conversations: res.data.data,
          nextConversationCursor: res.data.nextCursor
        });
      }
    } catch (e) {
      console.error('Failed to fetch conversations', e);
    } finally {
      set({ loadingConversations: false });
    }
  },
  
  fetchMessages: async (threadId: string, cursor?: string) => {
    set({ loadingMessages: true });
    try {
      const res = await emailService.getMessages(threadId, 20, cursor);
      // Backend returns newest first. We need oldest first for UI display.
      const reversed = [...res.data.data].reverse();
      
      if (cursor) {
        set((state) => ({ 
          // prepend older messages
          messages: [...reversed, ...state.messages],
          nextMessageCursor: res.data.nextCursor
        }));
      } else {
        set({ 
          messages: reversed,
          nextMessageCursor: res.data.nextCursor
        });
      }
    } catch (e) {
      console.error('Failed to fetch messages', e);
    } finally {
      set({ loadingMessages: false });
    }
  },
  
  setActiveThread: (threadId: string | null) => {
    set({ activeThreadId: threadId, messages: [], nextMessageCursor: null });
    if (threadId) {
      get().fetchMessages(threadId);
    }
  },
  
  syncEmails: async (email?: string) => {
    try {
      await emailService.syncEmails();
      get().fetchConversations(email);
    } catch (e) {
      console.error('Sync failed', e);
    }
  }
}));
