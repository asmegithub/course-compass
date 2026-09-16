import { apiFetch } from '@/lib/api';
import { ChatConversation, ChatMessage, ChatContact } from '@/types';

export interface SendMessagePayload {
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'SYSTEM';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  replyToId?: string;
}

export interface CreateGroupPayload {
  type: 'GROUP';
  title: string;
  description?: string;
  avatarUrl?: string;
  courseId?: string;
  initialMemberIds?: string[];
}

// Conversations
export const getConversations = (): Promise<ChatConversation[]> =>
  apiFetch('/api/chat/conversations');

export const getConversation = (id: string): Promise<ChatConversation> =>
  apiFetch(`/api/chat/conversations/${id}`);

// Messages
export const getMessages = (conversationId: string): Promise<ChatMessage[]> =>
  apiFetch(`/api/chat/conversations/${conversationId}/messages`);

export const sendMessage = (
  conversationId: string,
  payload: SendMessagePayload
): Promise<ChatMessage> =>
  apiFetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Direct chat
export const startDirectChat = (
  recipientId: string,
  courseId?: string
): Promise<ChatConversation> =>
  apiFetch('/api/chat/direct', {
    method: 'POST',
    body: JSON.stringify({ recipientId, courseId }),
  });

// Group chat
export const createGroup = (payload: CreateGroupPayload): Promise<ChatConversation> =>
  apiFetch('/api/chat/group', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Participants
export const addParticipant = (
  conversationId: string,
  userId: string,
  role = 'MEMBER'
): Promise<void> =>
  apiFetch(`/api/chat/conversations/${conversationId}/participants`, {
    method: 'POST',
    body: JSON.stringify({ userId, role }),
  });

export const removeParticipant = (
  conversationId: string,
  participantId: string
): Promise<void> =>
  apiFetch(`/api/chat/conversations/${conversationId}/participants/${participantId}`, {
    method: 'DELETE',
  });

// Read receipts
export const markAsRead = (conversationId: string): Promise<void> =>
  apiFetch(`/api/chat/conversations/${conversationId}/read`, { method: 'POST' });

// Reactions
export const toggleReaction = (
  messageId: string,
  emoji: string
): Promise<ChatMessage> =>
  apiFetch(`/api/chat/messages/${messageId}/reaction`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });

// Contacts
export const getContacts = (): Promise<ChatContact[]> =>
  apiFetch('/api/chat/contacts');

// Unread count
export const getChatUnreadCount = (): Promise<{ unreadCount: number }> =>
  apiFetch('/api/chat/unread-count');
