import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getConversations, getMessages, sendMessage, startDirectChat,
  createGroup, addParticipant, removeParticipant, markAsRead,
  toggleReaction, getContacts, SendMessagePayload, CreateGroupPayload,
} from '@/lib/chat-api';
import { ChatConversation, ChatMessage, ChatContact, ChatParticipant } from '@/types';
import {
  MessageSquare, Plus, Search, Send, Paperclip, Image, Mic,
  Users, X, ChevronRight, BookOpen, Phone, Mail, UserCheck,
  Settings2, LogOut, Smile, Reply, MoreVertical, Hash, Shield,
  ArrowLeft, Info, UserPlus,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

// ─── Constants ─────────────────────────────────────────────────────────────────
const QUICK_STARTERS = [
  "Hello! I'd like to ask about the course progress.",
  "I have a question about my child's assignment.",
  "Could we schedule a meeting to discuss performance?",
];

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '✅'];

const POLL_INTERVAL = 8000; // 8 seconds

// ─── Helper functions ─────────────────────────────────────────────────────────
const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getRoleBadgeStyle = (role: string) => {
  if (role === 'ADMIN') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (role === 'INSTRUCTOR') return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
  return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
};

const getRoleLabel = (role: string) => {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'INSTRUCTOR') return 'Instructor';
  return 'Student';
};

const parseReactions = (reactionsJson?: string): Record<string, string[]> => {
  if (!reactionsJson) return {};
  try { return JSON.parse(reactionsJson); } catch { return {}; }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── ParentBadge ─────────────────────────────────────────────────────────────
const ParentBadge = ({ name, relationship }: { name?: string; relationship?: string }) => {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
      <UserCheck className="h-3 w-3" />
      Parent: {name}{relationship ? ` (${relationship})` : ''}
    </span>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({
  msg, isMine, onReply, onReact, userId,
}: {
  msg: ChatMessage;
  isMine: boolean;
  onReply: (msg: ChatMessage) => void;
  onReact: (msgId: string, emoji: string) => void;
  userId: string;
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactions = parseReactions(msg.reactions);

  if (msg.messageType === 'SYSTEM') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  const isDeleted = msg.isDeleted;

  return (
    <div className={cn('flex gap-3 group my-1', isMine && 'flex-row-reverse')}>
      {/* Avatar */}
      {!isMine && (
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <Avatar className="h-8 w-8 ring-2 ring-white/10">
            <AvatarImage src={msg.senderProfileImage} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-violet-600 to-purple-700">
              {getInitials(msg.senderName)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={cn('flex flex-col max-w-[70%]', isMine && 'items-end')}>
        {/* Sender info */}
        {!isMine && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-foreground">{msg.senderName}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getRoleBadgeStyle(msg.senderRole))}>
              {getRoleLabel(msg.senderRole)}
            </span>
            {msg.parentName && <ParentBadge name={msg.parentName} relationship={msg.parentRelationship} />}
          </div>
        )}

        {/* Reply preview */}
        {msg.replyToId && msg.replyToContent && (
          <div className={cn(
            'mb-1 px-3 py-1.5 rounded-lg border-l-4 border-violet-500 bg-white/5 text-xs max-w-full',
            isMine && 'self-end'
          )}>
            <p className="font-semibold text-violet-400 text-[10px]">{msg.replyToSenderName}</p>
            <p className="text-muted-foreground line-clamp-2">{msg.replyToContent}</p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'relative px-4 py-2.5 rounded-2xl text-sm transition-all',
            isMine
              ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-tr-sm'
              : 'bg-white/8 border border-white/10 text-foreground rounded-tl-sm',
            isDeleted && 'opacity-50 italic'
          )}
        >
          {isDeleted ? (
            <span className="text-muted-foreground text-xs italic">Message deleted</span>
          ) : msg.messageType === 'IMAGE' ? (
            <div>
              <img
                src={msg.attachmentUrl}
                alt={msg.attachmentName || 'Image'}
                className="rounded-lg max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(msg.attachmentUrl, '_blank')}
              />
              {msg.content && <p className="mt-1.5">{msg.content}</p>}
            </div>
          ) : msg.messageType === 'FILE' ? (
            <a
              href={msg.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Paperclip className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-xs">{msg.attachmentName || 'File'}</p>
                <p className="text-[10px] opacity-70">{formatFileSize(msg.attachmentSize)}</p>
              </div>
            </a>
          ) : msg.messageType === 'VOICE' ? (
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <div className="flex gap-0.5 items-end h-5">
                {[4, 8, 5, 12, 7, 9, 4, 6, 10, 5].map((h, i) => (
                  <div key={i} className="w-1 rounded-full bg-current opacity-70" style={{ height: `${h}px` }} />
                ))}
              </div>
              <span className="text-xs opacity-70">Voice</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          )}

          <div className={cn('flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start')}>
            <span className={cn('text-[10px]', isMine ? 'text-white/60' : 'text-muted-foreground')}>
              {formatTime(msg.createdAt)}
            </span>
            {msg.isEdited && (
              <span className={cn('text-[10px]', isMine ? 'text-white/60' : 'text-muted-foreground')}>
                · edited
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all',
                  users.includes(userId)
                    ? 'bg-violet-500/30 border-violet-500/50 text-violet-200'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                )}
              >
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons (on hover) */}
      {!isDeleted && (
        <div className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center',
          isMine && 'flex-row-reverse'
        )}>
          <button
            onClick={() => onReply(msg)}
            className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            title="Reply"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowReactions(r => !r)}
              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              title="React"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            {showReactions && (
              <div className={cn(
                'absolute bottom-8 z-20 flex gap-1 p-2 rounded-2xl bg-card border border-white/10 shadow-2xl',
                isMine ? 'right-0' : 'left-0'
              )}>
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onReact(msg.id, emoji); setShowReactions(false); }}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── New Chat Dialog ───────────────────────────────────────────────────────────
const NewChatDialog = ({
  contacts, onStartDirect, onCreateGroup, onClose,
}: {
  contacts: ChatContact[];
  onStartDirect: (contact: ChatContact) => void;
  onCreateGroup: (payload: CreateGroupPayload) => void;
  onClose: () => void;
}) => {
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [search, setSearch] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<ChatContact[]>([]);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-lg">New Conversation</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setTab('direct')}
            className={cn('flex-1 py-3 text-sm font-medium transition-colors', tab === 'direct' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-muted-foreground hover:text-foreground')}
          >
            Direct Message
          </button>
          <button
            onClick={() => setTab('group')}
            className={cn('flex-1 py-3 text-sm font-medium transition-colors', tab === 'group' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-muted-foreground hover:text-foreground')}
          >
            Create Group
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {tab === 'group' && (
            <Input
              placeholder="Group name..."
              value={groupTitle}
              onChange={e => setGroupTitle(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>

          {tab === 'group' && selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(m => (
                <span key={m.userId} className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs">
                  {m.name}
                  <button onClick={() => setSelectedMembers(s => s.filter(x => x.userId !== m.userId))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">No contacts found.</p>
          )}

          {filtered.map(contact => {
            const isSelected = selectedMembers.some(m => m.userId === contact.userId);
            return (
              <button
                key={contact.userId}
                onClick={() => {
                  if (tab === 'direct') {
                    onStartDirect(contact);
                    onClose();
                  } else {
                    setSelectedMembers(s => isSelected ? s.filter(m => m.userId !== contact.userId) : [...s, contact]);
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                  isSelected ? 'bg-violet-500/20 border border-violet-500/30' : 'hover:bg-white/5'
                )}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={contact.profileImage} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-violet-600 to-purple-700">
                    {getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{contact.name}</p>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getRoleBadgeStyle(contact.role))}>
                      {getRoleLabel(contact.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    {contact.parentName && <ParentBadge name={contact.parentName} relationship={contact.parentRelationship} />}
                  </div>
                  {contact.courseTitle && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <BookOpen className="h-3 w-3 text-violet-400" />
                      <p className="text-xs text-violet-400 truncate">{contact.courseTitle}</p>
                    </div>
                  )}
                </div>
                {tab === 'group' && isSelected && (
                  <div className="h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {tab === 'group' && (
          <div className="px-5 pb-5">
            <Button
              onClick={() => {
                if (!groupTitle.trim()) { toast({ title: 'Group name required' }); return; }
                onCreateGroup({ type: 'GROUP', title: groupTitle, initialMemberIds: selectedMembers.map(m => m.userId) });
                onClose();
              }}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Create Group ({selectedMembers.length} members)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Group Info Drawer ────────────────────────────────────────────────────────
const GroupInfoDrawer = ({
  conversation, userId, onClose,
}: {
  conversation: ChatConversation;
  userId: string;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const removeMut = useMutation({
    mutationFn: ({ participantId }: { participantId: string }) =>
      removeParticipant(conversation.id, participantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-conversation', conversation.id] });
      toast({ title: 'Member removed' });
    },
  });

  const myParticipant = conversation.participants.find(p => p.userId === userId);
  const isAdmin = myParticipant?.role === 'ADMIN';

  return (
    <div className="flex flex-col h-full border-l border-white/10">
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <h3 className="font-semibold text-sm">Group Info</h3>
        <button onClick={onClose} className="h-7 w-7 rounded-full hover:bg-white/10 flex items-center justify-center">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Group avatar */}
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-16 w-16 ring-2 ring-violet-500/50">
            <AvatarImage src={conversation.avatarUrl} />
            <AvatarFallback className="text-xl bg-gradient-to-br from-violet-600 to-purple-700">
              {getInitials(conversation.title)}
            </AvatarFallback>
          </Avatar>
          <p className="font-semibold text-sm">{conversation.title}</p>
          {conversation.courseTitle && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-violet-400" />
              <span className="text-xs text-violet-400">{conversation.courseTitle}</span>
            </div>
          )}
          {conversation.description && (
            <p className="text-xs text-muted-foreground text-center">{conversation.description}</p>
          )}
        </div>

        {/* Members */}
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
            Members ({conversation.participants.length})
          </p>
          <div className="space-y-2">
            {conversation.participants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={p.profileImage} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-violet-600 to-purple-700">
                    {getInitials(p.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium">{p.name}</span>
                    <span className={cn('text-[10px] px-1 py-0.5 rounded border', getRoleBadgeStyle(p.userRole))}>
                      {getRoleLabel(p.userRole)}
                    </span>
                    {p.role === 'ADMIN' && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Admin</span>
                    )}
                  </div>
                  {p.parentName && <ParentBadge name={p.parentName} relationship={p.parentRelationship} />}
                </div>
                {isAdmin && p.userId !== userId && (
                  <button
                    onClick={() => removeMut.mutate({ participantId: p.id })}
                    className="h-6 w-6 rounded-full hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all"
                    title="Remove member"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main ChatPage ────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(
    searchParams.get('conversationId')
  );
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DIRECT' | 'GROUP'>('ALL');
  const [isMobileConvView, setIsMobileConvView] = useState(!!searchParams.get('conversationId'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: conversations = [], refetch: refetchConvs } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: getConversations,
    refetchInterval: POLL_INTERVAL,
  });

  const { data: activeConv } = useQuery({
    queryKey: ['chat-conversation', activeConvId],
    queryFn: () => activeConvId ? getConversations().then(cs => cs.find(c => c.id === activeConvId)) : null,
    enabled: !!activeConvId,
    refetchInterval: POLL_INTERVAL,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', activeConvId],
    queryFn: () => activeConvId ? getMessages(activeConvId) : Promise.resolve([]),
    enabled: !!activeConvId,
    refetchInterval: POLL_INTERVAL,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['chat-contacts'],
    queryFn: getContacts,
    staleTime: 30000,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const sendMut = useMutation({
    mutationFn: ({ convId, payload }: { convId: string; payload: SendMessagePayload }) =>
      sendMessage(convId, payload),
    onSuccess: (newMsg) => {
      qc.setQueryData(['chat-messages', activeConvId], (old: ChatMessage[] = []) => [...old, newMsg]);
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: () => toast({ title: 'Failed to send message', variant: 'destructive' }),
  });

  const directMut = useMutation({
    mutationFn: ({ contact }: { contact: ChatContact }) =>
      startDirectChat(contact.userId, contact.courseId),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
      setActiveConvId(conv.id);
      setIsMobileConvView(true);
    },
  });

  const groupMut = useMutation({
    mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
      setActiveConvId(conv.id);
      setIsMobileConvView(true);
      toast({ title: 'Group created!' });
    },
  });

  const reactMut = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      toggleReaction(messageId, emoji),
    onSuccess: (updated) => {
      qc.setQueryData(['chat-messages', activeConvId], (old: ChatMessage[] = []) =>
        old.map(m => m.id === updated.id ? updated : m)
      );
    },
  });

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeConvId) {
      markAsRead(activeConvId).catch(() => {});
      setSearchParams({ conversationId: activeConvId }, { replace: true });
    }
  }, [activeConvId]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!activeConvId || !messageInput.trim()) return;
    const payload: SendMessagePayload = {
      content: messageInput.trim(),
      messageType: 'TEXT',
      replyToId: replyTo?.id,
    };
    sendMut.mutate({ convId: activeConvId, payload });
    setMessageInput('');
    setReplyTo(null);
    messageInputRef.current?.focus();
  }, [activeConvId, messageInput, replyTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('http://localhost:8080/api/media/upload', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!resp.ok) throw new Error('Upload failed');
      const data = await resp.json();
      const isImage = file.type.startsWith('image/');

      sendMut.mutate({
        convId: activeConvId,
        payload: {
          content: isImage ? '' : file.name,
          messageType: isImage ? 'IMAGE' : 'FILE',
          attachmentUrl: data.url,
          attachmentName: file.name,
          attachmentSize: file.size,
        },
      });
    } catch {
      toast({ title: 'File upload failed', variant: 'destructive' });
    }

    e.target.value = '';
  };

  const handleQuickStarter = (text: string) => {
    setMessageInput(text);
    messageInputRef.current?.focus();
  };

  // ─── Filtered conversations ────────────────────────────────────────────────
  const filteredConvs = conversations.filter(c => {
    const searchLower = search.toLowerCase();
    const matchTitle = (c.title ?? '').toLowerCase().includes(searchLower) ||
      (c.directOtherParticipant?.name ?? '').toLowerCase().includes(searchLower) ||
      (c.lastMessageText ?? '').toLowerCase().includes(searchLower);
    const matchType = filterType === 'ALL' || c.type === filterType;
    return matchTitle && matchType;
  });

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  const currentConv = conversations.find(c => c.id === activeConvId);
  const convTitle = currentConv?.title || currentConv?.directOtherParticipant?.name || 'Chat';
  const otherUser = currentConv?.directOtherParticipant;

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.createdAt).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-88px)] rounded-2xl overflow-hidden border border-white/10 bg-background/60 backdrop-blur-lg">
        {/* ── LEFT: Conversations Sidebar ───────────────────────────────────── */}
        <div className={cn(
          'flex flex-col w-80 flex-shrink-0 border-r border-white/10 bg-card/50',
          isMobileConvView && 'hidden md:flex'
        )}>
          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-400" />
                <h2 className="font-bold text-lg">Messages</h2>
                {totalUnread > 0 && (
                  <span className="bg-violet-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setShowNewChat(true)}
                className="h-8 w-8 p-0 bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-white/5 border-white/10 rounded-xl"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1">
              {(['ALL', 'DIRECT', 'GROUP'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={cn(
                    'flex-1 text-xs py-1.5 rounded-lg font-medium transition-all',
                    filterType === f
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  {f === 'ALL' ? 'All' : f === 'DIRECT' ? '💬 Direct' : '👥 Groups'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="text-xs text-violet-400 hover:underline"
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              filteredConvs.map(conv => {
                const isActive = conv.id === activeConvId;
                const other = conv.directOtherParticipant;
                const displayName = conv.type === 'DIRECT' ? (other?.name ?? 'Chat') : (conv.title ?? 'Group');
                const avatarSrc = conv.type === 'DIRECT' ? other?.profileImage : conv.avatarUrl;
                const hasUnread = (conv.unreadCount ?? 0) > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setIsMobileConvView(true);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-all text-left hover:bg-white/5',
                      isActive && 'bg-violet-500/10 border-r-2 border-violet-500'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback className="text-sm bg-gradient-to-br from-violet-600 to-purple-700">
                          {conv.type === 'GROUP' ? <Users className="h-5 w-5" /> : getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={cn('text-sm font-medium truncate', hasUnread && 'text-foreground font-semibold')}>
                          {displayName}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {conv.courseTitle && (
                          <span className="text-[10px] text-violet-400 truncate">#{conv.courseTitle} · </span>
                        )}
                        {other?.parentName && (
                          <span className="text-[10px] text-amber-400 flex-shrink-0">👨‍👦 </span>
                        )}
                        <p className={cn(
                          'text-xs truncate',
                          hasUnread ? 'text-muted-foreground font-medium' : 'text-muted-foreground'
                        )}>
                          {conv.lastMessageText || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat Window ─────────────────────────────────────────────── */}
        <div className={cn(
          'flex-1 flex flex-col',
          !isMobileConvView && 'hidden md:flex'
        )}>
          {!activeConvId ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-violet-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Your Messages</h3>
                <p className="text-muted-foreground text-sm">Select a conversation or start a new one</p>
              </div>
              <Button
                onClick={() => setShowNewChat(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
              {/* Quick starters */}
              <div className="flex flex-wrap gap-2 justify-center max-w-sm mt-2">
                {QUICK_STARTERS.map(s => (
                  <button
                    key={s}
                    disabled
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-card/30">
                <button
                  className="md:hidden h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center"
                  onClick={() => setIsMobileConvView(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <Avatar className="h-10 w-10 ring-2 ring-white/10">
                  <AvatarImage src={currentConv?.avatarUrl || otherUser?.profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-700">
                    {currentConv?.type === 'GROUP' ? <Users className="h-5 w-5" /> : getInitials(convTitle)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">{convTitle}</h3>
                    {currentConv?.type === 'GROUP' && (
                      <span className="text-xs text-muted-foreground">
                        {currentConv.participants.length} members
                      </span>
                    )}
                    {otherUser?.userRole && currentConv?.type === 'DIRECT' && (
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getRoleBadgeStyle(otherUser.userRole))}>
                        {getRoleLabel(otherUser.userRole)}
                      </span>
                    )}
                    {otherUser?.parentName && currentConv?.type === 'DIRECT' && (
                      <ParentBadge name={otherUser.parentName} relationship={otherUser.parentRelationship} />
                    )}
                  </div>
                  {currentConv?.courseTitle && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-violet-400" />
                      <p className="text-xs text-violet-400">{currentConv.courseTitle}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentConv?.type === 'GROUP' && (
                    <button
                      onClick={() => setShowGroupInfo(s => !s)}
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center transition-all',
                        showGroupInfo ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/10'
                      )}
                      title="Group info"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-1 min-h-0">
                {/* Messages area */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5">
                    {groupedMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                          <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {QUICK_STARTERS.map(s => (
                            <button
                              key={s}
                              onClick={() => handleQuickStarter(s)}
                              className="text-xs px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      groupedMessages.map(group => (
                        <div key={group.date}>
                          <div className="flex justify-center my-4">
                            <span className="text-[10px] text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
                              {group.date}
                            </span>
                          </div>
                          {group.messages.map(msg => (
                            <MessageBubble
                              key={msg.id}
                              msg={msg}
                              isMine={msg.senderId === user?.id}
                              userId={user?.id ?? ''}
                              onReply={setReplyTo}
                              onReact={(id, emoji) => reactMut.mutate({ messageId: id, emoji })}
                            />
                          ))}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply preview */}
                  {replyTo && (
                    <div className="mx-5 mb-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
                      <div className="flex-1 min-w-0 border-l-4 border-violet-500 pl-2">
                        <p className="text-xs font-semibold text-violet-400">{replyTo.senderName}</p>
                        <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                      </div>
                      <button
                        onClick={() => setReplyTo(null)}
                        className="h-5 w-5 rounded-full hover:bg-white/10 flex items-center justify-center flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Input area */}
                  <div className="px-4 pb-4">
                    <div className="flex items-end gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 focus-within:border-violet-500/50 transition-colors">
                      {/* File / Image buttons */}
                      <div className="flex gap-1 pb-1">
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="*/*" />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 w-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                          title="Attach file"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); }}}
                          className="h-8 w-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                          title="Send image"
                        >
                          <Image className="h-4 w-4" />
                        </button>
                      </div>

                      <Input
                        ref={messageInputRef}
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm py-1.5 px-0 resize-none"
                      />

                      <Button
                        onClick={handleSend}
                        disabled={!messageInput.trim() || sendMut.isPending}
                        size="sm"
                        className={cn(
                          'h-9 w-9 p-0 rounded-xl transition-all',
                          messageInput.trim()
                            ? 'bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                            : 'bg-white/5 text-muted-foreground'
                        )}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Group info drawer */}
                {showGroupInfo && currentConv?.type === 'GROUP' && (
                  <div className="w-72 flex-shrink-0">
                    <GroupInfoDrawer
                      conversation={currentConv as ChatConversation}
                      userId={user?.id ?? ''}
                      onClose={() => setShowGroupInfo(false)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatDialog
          contacts={contacts}
          onStartDirect={contact => directMut.mutate({ contact })}
          onCreateGroup={payload => groupMut.mutate(payload)}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default ChatPage;
