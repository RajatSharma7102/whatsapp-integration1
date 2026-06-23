export interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  status: string;
  source: string;
  tags: string[];
  notes?: string;
  assignedTo?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  leadId: Lead | string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOpen: boolean;
  assignedTo?: any;
}

export interface Message {
  _id: string;
  conversationId: string;
  leadId: string;
  direction: 'incoming' | 'outgoing';
  messageType: string;
  message: string;
  messageId?: string;
  status: 'accepted' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  mediaUrl?: string;
  mediaType?: string;
}
