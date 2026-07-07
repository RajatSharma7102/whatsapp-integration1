export interface Team {
  _id: string;
  name: string;
  description?: string;
  color: string;
  members: any[];
  leadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  contactNumber?: string;
  alternatePhone?: string;
  status: string;
  source: string;
  tags: string[];
  notes?: string;
  selectedServices?: string[];
  requirement?: string;
  assignedTo?: any;
  teamId?: Team | null;
  isActive: boolean;
  unreadCount?: number;
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
  botStatus: 'BOT_ACTIVE' | 'HUMAN_ASSIGNED';
  botState: 'ASK_NAME' | 'CONFIRM_NUMBER' | 'ASK_PHONE' | 'ASK_SERVICES' | 'ASK_REQUIREMENT' | 'COMPLETED';
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

export interface WhatsAppAccount {
  _id: string;
  displayName: string;
  phoneNumber: string;
  phoneNumberId: string;
  department: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'BANNED';
  isDefault: boolean;
  connectedAt: string;
}
