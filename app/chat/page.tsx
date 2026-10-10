'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { authService, getLocalActiveUser, setLocalActiveUser } from '@/services/authService';
import { chatService } from '@/services/chatService';
import { messageService } from '@/services/messageService';
import { storageService } from '@/services/storageService';
import { notificationService } from '@/services/notificationService';
import { userService } from '@/services/userService';
import { offlineQueue } from '@/services/offlineQueue';
import { ChatList } from '@/components/chat/ChatList';
import { ChatArea } from '@/components/chat/ChatArea';
import { NewChatModal } from '@/components/chat/NewChatModal';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { StatusModal } from '@/components/status/StatusModal';
import { CreateStatusModal } from '@/components/status/CreateStatusModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';
import { CallModal } from '@/components/calling/CallModal';
import { IncomingCallBanner } from '@/components/calling/IncomingCallBanner';
import { WebRTCCallSession } from '@/lib/webrtc/callManager';
import {
  Profile,
  Chat,
  Message,
  StatusStory,
  NotificationItem,
  CallType,
  MessageReaction,
} from '@/types/database';
import { WifiOff, Wifi, Loader2 } from 'lucide-react';

export default function ChatMainPage() {
  const router = useRouter();

  // Core User & Data State
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<StatusStory[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Realtime & Presence
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingChatIds, setTypingChatIds] = useState<string[]>([]);
  const [isOnlineNetwork, setIsOnlineNetwork] = useState(true);
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Calling State
  const [activeCallSession, setActiveCallSession] = useState<WebRTCCallSession | null>(null);
  const activeCallSessionRef = useRef<WebRTCCallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    callerId: string;
    callType: CallType;
    callerProfile?: Profile;
  } | null>(null);
  const incomingCallRef = useRef<{
    callId: string;
    callerId: string;
    callType: CallType;
    callerProfile?: Profile;
  } | null>(null);
  const [callStatus, setCallStatus] = useState<string>('calling');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<any>(null);
  const [callPartner, setCallPartner] = useState<{
    id: string;
    name: string;
    avatar?: string | null;
  } | null>(null);
  const selectedChatIdRef = useRef<string | null>(selectedChatId);
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);
  useEffect(() => {
    activeCallSessionRef.current = activeCallSession;
  }, [activeCallSession]);
  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  // Modals & Panels
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateStatusModal, setShowCreateStatusModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // 1. Initial Load & Auth Verification
  useEffect(() => {
    async function initUser() {
      try {
        // Check local storage for authenticated session
        const localUser = getLocalActiveUser();
        if (localUser && localUser.id) {
          setCurrentUser(localUser);

          // Always fetch freshest profile from PostgreSQL database to ensure DP is preserved on reload
          try {
            const fresh = await userService.getProfile(localUser.id);
            if (fresh) {
              setCurrentUser(fresh);
              setLocalActiveUser(fresh);
            }
          } catch {}

          await loadUserData(localUser.id);
          setLoadingAuth(false);
          return;
        }

        // Check real profile
        const user = await authService.getCurrentProfile();
        if (user) {
          setCurrentUser(user);
          setLocalActiveUser(user);
          await loadUserData(user.id);
          setLoadingAuth(false);
        } else {
          // Unauthenticated: redirect to login
          setLoadingAuth(false);
          router.push('/auth/login');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setLoadingAuth(false);
        router.push('/auth/login');
      }
    }

    initUser();

    // Online / Offline listener
    const handleOnline = async () => {
      setIsOnlineNetwork(true);
      setShowNetworkToast(true);

      const { sentCount } = await offlineQueue.flush((tempId, realMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...realMsg, is_pending: false } : m))
        );
      });
      setOfflineQueueCount(offlineQueue.getQueueCount());
      if (sentCount > 0) {
        setToastText(`Back online: ${sentCount} cached message(s) sent!`);
      } else {
        setToastText('Back online');
      }
      setTimeout(() => setShowNetworkToast(false), 3500);
    };

    const handleOffline = () => {
      setIsOnlineNetwork(false);
      setOfflineQueueCount(offlineQueue.getQueueCount());
      setToastText('You are offline. Messages will save in cache memory.');
      setShowNetworkToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOfflineQueueCount(offlineQueue.getQueueCount());
    setIsOnlineNetwork(!offlineQueue.isOffline());

    if (!offlineQueue.isOffline()) {
      offlineQueue.flush((tempId, realMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...realMsg, is_pending: false } : m))
        );
      }).then(() => {
        setOfflineQueueCount(offlineQueue.getQueueCount());
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Load Chats, Statuses, Notifications
  const loadUserData = async (userId: string) => {
    try {
      const userChats = await chatService.getChats(userId);
      setChats(userChats);

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (!isMobile && userChats.length > 0) {
        setSelectedChatId((curr) =>
          curr && userChats.some((c) => c.id === curr) ? curr : userChats[0].id
        );
      } else if (isMobile) {
        // On mobile, keep selectedChatId null initially so user sees the conversation list first
        setSelectedChatId((curr) => (curr && userChats.some((c) => c.id === curr) ? curr : null));
      } else {
        setSelectedChatId(null);
      }

      const stories = await userService.getStatuses();
      setStatuses(stories);

      const notifs = await notificationService.getNotifications(userId);
      setNotifications(notifs);
    } catch (e) {
      console.warn('Error loading user chats:', e);
      setChats([]);
      setSelectedChatId(null);
    }
  };

  // 3. Realtime Chat Messages Subscription
  useEffect(() => {
    if (!selectedChatId || !currentUser) return;

    // Acknowledge read locally immediately
    setChats((prev) =>
      prev.map((c) => (c.id === selectedChatId ? { ...c, unread_count: 0 } : c))
    );

    // Mark as read in PostgreSQL backend
    chatService.markAsRead(selectedChatId, currentUser.id).catch(() => {});
    messageService.markMessagesAsRead(selectedChatId, currentUser.id).catch(() => {});

    // Broadcast receipt to active participants
    const readBroadcast = supabase.channel(`chat_room:${selectedChatId}`);
    readBroadcast.send({
      type: 'broadcast',
      event: 'receipt:read',
      payload: { chatId: selectedChatId, userId: currentUser.id },
    }).catch(() => {});

    // Fetch initial messages for selected chat
    messageService.getMessages(selectedChatId).then((msgs) => {
      const pendingQueue = offlineQueue.getQueue().filter((q) => q.chatId === selectedChatId);
      const pendingMsgs = pendingQueue.map((item) => ({
        id: item.tempId,
        chat_id: item.chatId,
        sender_id: item.senderId,
        message_type: (item.messageType as any) || 'text',
        text: item.text,
        reply_to_message_id: item.replyToMessageId || null,
        is_edited: false,
        is_deleted: false,
        is_pending: true,
        created_at: item.queuedAt,
        updated_at: item.queuedAt,
        sender: currentUser,
      }));

      const existingIds = new Set(msgs.map((m) => m.id));
      const filteredPending = pendingMsgs.filter((p) => !existingIds.has(p.id));
      setMessages([...msgs, ...filteredPending]);
    });

    // Supabase Realtime Channel for chat
    const channel = supabase.channel(`chat_room:${selectedChatId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'message:new' }, ({ payload }) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          const next = [...prev, payload.message];
          messageService.saveMessagesForChat(selectedChatId, next);
          return next;
        });

        setChats((prev) =>
          prev.map((c) =>
            c.id === selectedChatId
              ? { ...c, last_message: payload.message, updated_at: new Date().toISOString() }
              : c
          )
        );

        // Mark as read right away because chat is actively selected
        chatService.markAsRead(selectedChatId, currentUser.id).catch(() => {});
        messageService.markMessagesAsRead(selectedChatId, currentUser.id).catch(() => {});
        channel.send({
          type: 'broadcast',
          event: 'receipt:read',
          payload: { chatId: selectedChatId, userId: currentUser.id },
        }).catch(() => {});
      })
      .on('broadcast', { event: 'message:updated' }, ({ payload }) => {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === payload.message.id ? payload.message : m));
          messageService.saveMessagesForChat(selectedChatId, next);
          return next;
        });
      })
      .on('broadcast', { event: 'reaction:update' }, ({ payload }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m
          )
        );
      })
      .on('broadcast', { event: 'message:pinned' }, ({ payload }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId ? { ...m, is_pinned: payload.isPinned } : m
          )
        );
      })
      .on('broadcast', { event: 'poll:vote' }, async () => {
        const refreshed = await messageService.getMessages(selectedChatId);
        setMessages(refreshed);
      })
      .on('broadcast', { event: 'receipt:read' }, ({ payload }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === currentUser.id
              ? {
                  ...m,
                  receipts: [
                    {
                      id: `rc_${Date.now()}`,
                      message_id: m.id,
                      user_id: payload.userId,
                      delivered_at: new Date().toISOString(),
                      read_at: new Date().toISOString(),
                    },
                  ],
                }
              : m
          )
        );
      })
      .on('broadcast', { event: 'member:change' }, async () => {
        const refreshedChats = await chatService.getChats(currentUser.id);
        setChats(refreshedChats);
      })
      .on('broadcast', { event: 'typing:start' }, () => {
        setTypingChatIds((prev) => [...new Set([...prev, selectedChatId])]);
      })
      .on('broadcast', { event: 'typing:stop' }, () => {
        setTypingChatIds((prev) => prev.filter((id) => id !== selectedChatId));
      })
      .on('broadcast', { event: 'incoming-call' }, async ({ payload }) => {
        if (!payload || payload.callerId === currentUser.id) return;
        let caller = payload.callerProfile;
        if (!caller && payload.callerId) {
          caller = await userService.getProfile(payload.callerId);
        }
        const callData = {
          callId: payload.callId,
          callerId: payload.callerId,
          callType: payload.callType,
          callerProfile: caller || {
            id: payload.callerId,
            full_name: payload.chatName || 'Incoming Caller',
            username: 'caller',
            avatar_url: null,
            email: '',
            created_at: '',
            updated_at: '',
          },
        };
        setIncomingCall(callData);
        incomingCallRef.current = callData;
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId, currentUser]);

  // Web Audio chime for incoming messages
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.12, now);
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  };

  // Helper to broadcast new message to chat room and each member's personal inbox
  const broadcastNewMessage = (sent: Message, chatId: string) => {
    // 1. Chat room broadcast
    const channel = supabase.channel(`chat_room:${chatId}`);
    channel.send({
      type: 'broadcast',
      event: 'message:new',
      payload: { message: sent },
    }).catch(() => {});

    // 2. Personal inbox broadcast to each recipient
    const activeChat = chats.find((c) => c.id === chatId);
    const recipients = activeChat?.members?.filter((m) => m.user_id !== currentUser?.id) || [];
    for (const r of recipients) {
      if (!r.user_id) continue;
      const inboxCh = supabase.channel(`user:${r.user_id}`);
      inboxCh.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          inboxCh.send({
            type: 'broadcast',
            event: 'message:notify',
            payload: { message: sent, chatId },
          }).catch(() => {});
        }
      });
    }
  };

  // 4. Realtime Presence, Incoming Messages & Call Signaling Subscription
  useEffect(() => {
    if (!currentUser) return;

    const presenceChannel = supabase.channel('online_presence', {
      config: { presence: { key: currentUser.id } },
    });

    const syncPresenceState = () => {
      const state = presenceChannel.presenceState();
      const userIds = Object.keys(state);
      setOnlineUserIds(Array.from(new Set([...userIds, currentUser.id])));
    };

    presenceChannel
      .on('presence', { event: 'sync' }, syncPresenceState)
      .on('presence', { event: 'join' }, syncPresenceState)
      .on('presence', { event: 'leave' }, syncPresenceState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            user_id: currentUser.id,
          });
          syncPresenceState();
        }
      });

    // Periodic heartbeat to keep presence refreshed
    const presenceHeartbeat = setInterval(() => {
      presenceChannel.track({
        online_at: new Date().toISOString(),
        user_id: currentUser.id,
      }).catch(() => {});
    }, 20000);

    // User Signaling Channel for Incoming Calls and Inbox Notifications
    const userChannel = supabase.channel(`user:${currentUser.id}`);
    userChannel
      .on('broadcast', { event: 'incoming-call' }, async ({ payload }) => {
        let caller = payload.callerProfile;
        if (!caller && payload.callerId) {
          caller = await userService.getProfile(payload.callerId);
        }
        const callData = {
          callId: payload.callId,
          callerId: payload.callerId,
          callType: payload.callType,
          callerProfile: caller || {
            id: payload.callerId,
            full_name: payload.chatName || 'Incoming Caller',
            username: 'caller',
            avatar_url: null,
            email: '',
            created_at: '',
            updated_at: '',
          },
        };
        setIncomingCall(callData);
        incomingCallRef.current = callData;
      })
      .on('broadcast', { event: 'call-rejected' }, ({ payload }) => {
        const session = activeCallSessionRef.current;
        if (session && (!payload?.callId || session.callId === payload.callId)) {
          handleEndCall();
        }
      })
      .on('broadcast', { event: 'call-ended' }, ({ payload }) => {
        const session = activeCallSessionRef.current;
        if (session && (!payload?.callId || session.callId === payload.callId)) {
          handleEndCall();
        }
        const inc = incomingCallRef.current;
        if (inc && (!payload?.callId || inc.callId === payload.callId)) {
          setIncomingCall(null);
          incomingCallRef.current = null;
        }
      })
      .on('broadcast', { event: 'group:joined' }, async () => {
        const refreshed = await chatService.getChats(currentUser.id);
        setChats(refreshed);
      })
      .on('broadcast', { event: 'message:notify' }, ({ payload }) => {
        const { message, chatId } = payload;
        if (!message) return;

        const isCurrent = chatId === selectedChatIdRef.current;
        if (isCurrent) {
          setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
          chatService.markAsRead(chatId, currentUser.id).catch(() => {});
        } else {
          playNotificationChime();
        }

        setChats((prev) => {
          const idx = prev.findIndex((c) => c.id === chatId);
          if (idx === -1) {
            chatService.getChats(currentUser.id).then(setChats);
            return prev;
          }
          const updated = [...prev];
          const target = { ...updated[idx] };
          target.last_message = message;
          target.updated_at = message.created_at;
          if (!isCurrent) {
            target.unread_count = (target.unread_count || 0) + 1;
          }
          updated.splice(idx, 1);
          return [target, ...updated];
        });
      })
      .subscribe();

    // Global PostgreSQL Realtime subscription for messages across all chats
    const pgMessagesChannel = supabase
      .channel('global_pg_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          if (!newMsg || newMsg.sender_id === currentUser.id) return;

          const isCurrent = newMsg.chat_id === selectedChatIdRef.current;
          setChats((prev) => {
            const idx = prev.findIndex((c) => c.id === newMsg.chat_id);
            if (idx === -1) {
              chatService.getChats(currentUser.id).then(setChats);
              return prev;
            }
            const updated = [...prev];
            const target = { ...updated[idx] };
            target.last_message = newMsg;
            target.updated_at = newMsg.created_at;

            if (!isCurrent) {
              target.unread_count = (target.unread_count || 0) + 1;
              playNotificationChime();
            }

            updated.splice(idx, 1);
            return [target, ...updated];
          });

          if (isCurrent) {
            setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(presenceHeartbeat);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(userChannel);
      supabase.removeChannel(pgMessagesChannel);
    };
  }, [currentUser]);

  // Flush offline cache queue
  const flushOfflineQueue = async () => {
    const { sentCount } = await offlineQueue.flush((tempId, realMsg) => {
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === tempId ? { ...realMsg, is_pending: false } : m));
        if (selectedChatId) messageService.saveMessagesForChat(selectedChatId, next);
        return next;
      });
    });
    setOfflineQueueCount(offlineQueue.getQueueCount());
    if (sentCount > 0) {
      setToastText(`Back online: ${sentCount} cached message(s) sent!`);
      setShowNetworkToast(true);
      setTimeout(() => setShowNetworkToast(false), 3500);
    }
  };

  const toggleOfflineSimulation = async () => {
    const nextSimulated = !offlineQueue.isSimulatedOffline();
    offlineQueue.setSimulatedOffline(nextSimulated);
    const offlineNow = offlineQueue.isOffline();
    setIsOnlineNetwork(!offlineNow);
    setOfflineQueueCount(offlineQueue.getQueueCount());
    setShowNetworkToast(true);
    if (!offlineNow) {
      await flushOfflineQueue();
    } else {
      setToastText('Offline simulated: Messages will save to cache memory');
      setTimeout(() => setShowNetworkToast(false), 3500);
    }
  };

  // 5. Handle Send Message (Text)
  const handleSendMessage = async (text: string, replyToId?: string | null) => {
    if (!selectedChatId || !currentUser) return;

    const tempId = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isCurrentlyOffline = offlineQueue.isOffline();

    const repliedMsg = replyToId ? messages.find((m) => m.id === replyToId) : null;
    const replyQuote = repliedMsg
      ? {
          id: repliedMsg.id,
          text: repliedMsg.text,
          message_type: repliedMsg.message_type,
          sender: repliedMsg.sender ? { full_name: repliedMsg.sender.full_name } : undefined,
        }
      : undefined;

    const optimisticMsg: any = {
      id: tempId,
      chat_id: selectedChatId,
      sender_id: currentUser.id,
      message_type: 'text',
      text,
      reply_to_message_id: replyToId || null,
      reply_to: replyQuote,
      is_edited: false,
      is_deleted: false,
      is_pending: isCurrentlyOffline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: currentUser,
    };

    setMessages((prev) => {
      const next = [...prev, optimisticMsg];
      messageService.saveMessagesForChat(selectedChatId, next);
      return next;
    });

    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId
          ? { ...c, last_message: optimisticMsg, updated_at: new Date().toISOString() }
          : c
      )
    );

    if (isCurrentlyOffline) {
      offlineQueue.enqueue({
        tempId,
        chatId: selectedChatId,
        senderId: currentUser.id,
        text,
        replyToMessageId: replyToId,
        queuedAt: new Date().toISOString(),
      });
      setOfflineQueueCount(offlineQueue.getQueueCount());
      setToastText('Offline: Message saved in cache memory. Will send automatically when online.');
      setShowNetworkToast(true);
      return;
    }

    try {
      const sent = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        text,
        replyToMessageId: replyToId,
      });

      if (replyQuote && !sent.reply_to) {
        sent.reply_to = replyQuote as any;
      }

      setMessages((prev) => {
        const next = prev.map((m) => (m.id === tempId ? { ...sent, is_pending: false } : m));
        messageService.saveMessagesForChat(selectedChatId, next);
        return next;
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );

      // Broadcast to all participants and inboxes
      broadcastNewMessage(sent, selectedChatId);
    } catch (e) {
      console.warn('Network error, saving to cache memory:', e);
      offlineQueue.enqueue({
        tempId,
        chatId: selectedChatId,
        senderId: currentUser.id,
        text,
        replyToMessageId: replyToId,
        queuedAt: new Date().toISOString(),
      });
      setOfflineQueueCount(offlineQueue.getQueueCount());
      setToastText('Network disconnected: message queued in cache memory.');
      setShowNetworkToast(true);
    }
  };

  // 6. Handle Send Media (Image, Video, Document)
  const handleSendMedia = async (file: File, category: 'image' | 'video' | 'document') => {
    if (!selectedChatId || !currentUser) return;

    try {
      const upload = await storageService.uploadChatMedia(file, selectedChatId, category);

      const sent = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        messageType: category,
        text: file.name,
        media: [
          {
            storagePath: upload.publicUrl,
            fileName: upload.fileName,
            mimeType: upload.mimeType,
            fileSize: upload.fileSize,
          },
        ],
      });

      setMessages((prev) => {
        const next = [...prev, sent];
        messageService.saveMessagesForChat(selectedChatId, next);
        return next;
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );

      broadcastNewMessage(sent, selectedChatId);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload media file');
    }
  };

  // 7. Handle Send Voice Note
  const handleSendVoice = async (blob: Blob, duration: number) => {
    if (!selectedChatId || !currentUser) return;

    try {
      const upload = await storageService.uploadChatMedia(blob, selectedChatId, 'voice');

      const sent = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        messageType: 'voice',
        text: upload.publicUrl,
        media: [
          {
            storagePath: upload.publicUrl,
            fileName: upload.fileName,
            mimeType: upload.mimeType,
            fileSize: upload.fileSize,
            duration,
          },
        ],
      });

      setMessages((prev) => {
        const next = [...prev, sent];
        messageService.saveMessagesForChat(selectedChatId, next);
        return next;
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );

      broadcastNewMessage(sent, selectedChatId);
    } catch (err: any) {
      alert(err?.message || 'Failed to send voice note');
    }
  };

  // 8. Handle Send Sticker
  const handleSendSticker = async (stickerUrl: string) => {
    if (!selectedChatId || !currentUser) return;

    try {
      const sent = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        messageType: 'sticker',
        text: stickerUrl,
      });

      setMessages((prev) => {
        const next = [...prev, sent];
        messageService.saveMessagesForChat(selectedChatId, next);
        return next;
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );

      broadcastNewMessage(sent, selectedChatId);
    } catch (err: any) {
      alert(err?.message || 'Failed to send sticker');
    }
  };

  // 9. Handle Poll Creation
  const handleSendPoll = async (pollData: { question: string; options: string[]; isMultipleChoice: boolean }) => {
    if (!selectedChatId || !currentUser) return;

    try {
      const sent = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        messageType: 'poll',
        text: pollData.question,
        poll: {
          question: pollData.question,
          options: pollData.options,
          isMultipleChoice: pollData.isMultipleChoice,
        },
      });

      setMessages((prev) => {
        const next = [...prev, sent];
        messageService.saveMessagesForChat(selectedChatId, next);
        return next;
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );

      broadcastNewMessage(sent, selectedChatId);
    } catch (err: any) {
      alert(err?.message || 'Failed to create poll');
    }
  };

  // 10. Handle Location
  const handleSendLocation = async (loc: { latitude: number; longitude: number; address?: string }) => {
    if (!selectedChatId || !currentUser) return;

    try {
      const sent = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        messageType: 'location',
        text: loc.address || 'Shared Live Location',
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
        },
      });

      setMessages((prev) => {
        const next = [...prev, sent];
        messageService.saveMessagesForChat(selectedChatId, next);
        return next;
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );

      broadcastNewMessage(sent, selectedChatId);
    } catch (err: any) {
      alert(err?.message || 'Failed to share location');
    }
  };

  // 11. Handle Contact
  const handleSendContact = async (contact: { contactUserId: string; contactName: string; contactPhone?: string }) => {
    if (!selectedChatId || !currentUser) return;

    try {
      const sent = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        messageType: 'contact',
        text: contact.contactName,
        contact: {
          contactUserId: contact.contactUserId,
          contactName: contact.contactName,
          contactPhone: contact.contactPhone,
        },
      });

      setMessages((prev) => {
        const next = [...prev, sent];
        messageService.saveMessagesForChat(selectedChatId, next);
        return next;
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );

      broadcastNewMessage(sent, selectedChatId);
    } catch (err: any) {
      alert(err?.message || 'Failed to share contact');
    }
  };

  // 12. Reactions: strictly 1 reaction per user per message, real-time broadcast
  const handleReact = async (messageId: string, emoji: string) => {
    if (!currentUser || !selectedChatId) return;

    // Local optimistic update
    setMessages((prev) => {
      const next = prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || [];
        const userReaction = currentReactions.find((r) => r.user_id === currentUser.id);
        let updatedReactions: MessageReaction[];
        if (userReaction && userReaction.emoji === emoji) {
          // Toggle off
          updatedReactions = currentReactions.filter((r) => r.user_id !== currentUser.id);
        } else {
          // Replace or add exactly 1 reaction
          updatedReactions = [
            ...currentReactions.filter((r) => r.user_id !== currentUser.id),
            {
              id: `r_${Date.now()}`,
              message_id: messageId,
              user_id: currentUser.id,
              emoji,
              created_at: new Date().toISOString(),
            },
          ];
        }
        return { ...m, reactions: updatedReactions };
      });
      messageService.saveMessagesForChat(selectedChatId, next);
      return next;
    });

    try {
      const updatedReactions = await messageService.reactToMessage(messageId, currentUser.id, emoji);
      const channel = supabase.channel(`chat_room:${selectedChatId}`);
      channel.send({
        type: 'broadcast',
        event: 'reaction:update',
        payload: { messageId, reactions: updatedReactions },
      });
    } catch (e) {
      console.error('Failed to persist reaction:', e);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    setMessages((prev) => {
      const next = prev.map((m) =>
        m.id === messageId ? { ...m, text: newText, is_edited: true, edited_at: new Date().toISOString() } : m
      );
      if (selectedChatId) messageService.saveMessagesForChat(selectedChatId, next);
      return next;
    });

    try {
      await messageService.editMessage(messageId, newText);
      const channel = supabase.channel(`chat_room:${selectedChatId}`);
      channel.send({
        type: 'broadcast',
        event: 'message:updated',
        payload: { message: { id: messageId, text: newText, is_edited: true } },
      });
    } catch (e) {
      console.error('Failed to edit message:', e);
    }
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    setMessages((prev) => {
      const next = prev.map((m) =>
        m.id === messageId ? { ...m, is_deleted: true, text: 'This message was deleted' } : m
      );
      if (selectedChatId) messageService.saveMessagesForChat(selectedChatId, next);
      return next;
    });

    try {
      await messageService.deleteMessage(messageId);
      const channel = supabase.channel(`chat_room:${selectedChatId}`);
      channel.send({
        type: 'broadcast',
        event: 'message:updated',
        payload: { message: { id: messageId, is_deleted: true, text: 'This message was deleted' } },
      });
    } catch (e) {
      console.error('Failed to delete message:', e);
    }
  };

  const handleDeleteForMe = (messageId: string) => {
    if (!currentUser) return;
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== messageId);
      if (selectedChatId) messageService.saveMessagesForChat(selectedChatId, next);
      return next;
    });
  };

  // 13. Poll Voting: Persists to PostgreSQL & broadcasts
  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (!currentUser || !selectedChatId) return;

    try {
      await messageService.votePoll(pollId, optionId, currentUser.id);
      const refreshed = await messageService.getMessages(selectedChatId);
      setMessages(refreshed);

      const channel = supabase.channel(`chat_room:${selectedChatId}`);
      channel.send({
        type: 'broadcast',
        event: 'poll:vote',
        payload: { pollId, optionId, userId: currentUser.id },
      });
    } catch (e) {
      console.error('Vote poll error:', e);
    }
  };

  // Helper to start call duration timer
  const startCallDurationTimer = () => {
    if (!callTimerRef.current) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  // 14. WebRTC Calling Triggers: 1-to-1 & Group Signaling
  const handleStartCall = async (type: CallType) => {
    if (!selectedChat || !currentUser) return;

    const targetMembers = selectedChat.members?.filter((m) => m.user_id !== currentUser.id) || [];
    const targetUserId = targetMembers[0]?.user_id;
    if (!targetUserId && !selectedChat.is_group) {
      alert('No participants found in this chat to call');
      return;
    }

    const partnerName =
      (selectedChat.is_group
        ? selectedChat.name
        : targetMembers[0]?.profile?.full_name || selectedChat.name) || 'Contact';
    const partnerAvatar = selectedChat.is_group
      ? selectedChat.photo_url
      : targetMembers[0]?.profile?.avatar_url || selectedChat.photo_url;

    setCallPartner({
      id: targetUserId || selectedChat.id,
      name: partnerName,
      avatar: partnerAvatar,
    });

    const callId = `call_${Date.now()}`;
    const session = new WebRTCCallSession(
      callId,
      currentUser.id,
      targetUserId || currentUser.id,
      type,
      (remStream) => {
        setRemoteStream(remStream);
        setCallStatus('connected');
        startCallDurationTimer();
      },
      () => {
        handleEndCall();
      },
      () => {
        setCallStatus('connected');
        startCallDurationTimer();
      }
    );

    setActiveCallSession(session);
    activeCallSessionRef.current = session;
    setCallStatus('ringing');
    setCallDuration(0);

    try {
      const stream = await session.initialize(true);
      setLocalStream(stream);

      // Signal recipients across both personal channel and current room channel
      const recipientIds = selectedChat.is_group
        ? targetMembers.map((m) => m.user_id)
        : [targetUserId];

      const sendCallPulse = () => {
        // Broadcast to chat room
        const roomChannel = supabase.channel(`chat_room:${selectedChat.id}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'incoming-call',
          payload: {
            callId,
            callerId: currentUser.id,
            callType: type,
            chatId: selectedChat.id,
            chatName: currentUser.full_name || 'Incoming Caller',
            callerProfile: currentUser,
          },
        }).catch(() => {});

        // Broadcast to each recipient's personal user inbox
        for (const rid of recipientIds) {
          if (!rid || rid === currentUser.id) continue;
          const targetChannel = supabase.channel(`user:${rid}`);
          targetChannel.subscribe((subStatus) => {
            if (subStatus === 'SUBSCRIBED') {
              targetChannel.send({
                type: 'broadcast',
                event: 'incoming-call',
                payload: {
                  callId,
                  callerId: currentUser.id,
                  callType: type,
                  chatId: selectedChat.id,
                  chatName: currentUser.full_name || 'Incoming Caller',
                  callerProfile: currentUser,
                },
              }).catch(() => {});
            }
          });
        }
      };

      sendCallPulse();
      setTimeout(sendCallPulse, 400);
      setTimeout(sendCallPulse, 900);
    } catch (err: any) {
      alert(err?.message || 'Failed to access camera/microphone for calling');
      handleEndCall();
    }
  };

  const handleAcceptIncomingCall = async () => {
    const inc = incomingCallRef.current || incomingCall;
    if (!inc || !currentUser) return;

    setCallPartner({
      id: inc.callerId,
      name: inc.callerProfile?.full_name || 'Incoming Caller',
      avatar: inc.callerProfile?.avatar_url,
    });

    const session = new WebRTCCallSession(
      inc.callId,
      currentUser.id,
      inc.callerId,
      inc.callType,
      (remStream) => {
        setRemoteStream(remStream);
        setCallStatus('connected');
        startCallDurationTimer();
      },
      () => {
        handleEndCall();
      },
      () => {
        setCallStatus('connected');
        startCallDurationTimer();
      }
    );

    setActiveCallSession(session);
    activeCallSessionRef.current = session;
    setCallStatus('connected');
    setIncomingCall(null);
    incomingCallRef.current = null;

    try {
      const stream = await session.initialize(false);
      setLocalStream(stream);
      // Duration timer only starts when connection actually succeeds (via onConnected or onRemoteStream)!
    } catch (err: any) {
      console.warn('Failed to accept call:', err);
      handleEndCall();
    }
  };

  const handleDeclineIncomingCall = () => {
    const inc = incomingCallRef.current || incomingCall;
    if (inc) {
      // 1. Send signal on call channel
      const roomCh = supabase.channel(`call:${inc.callId}`);
      roomCh.subscribe((st) => {
        if (st === 'SUBSCRIBED') {
          roomCh.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'call-rejected',
              senderId: currentUser?.id,
              callId: inc.callId,
            },
          }).catch(() => {});
          roomCh.send({
            type: 'broadcast',
            event: 'call-rejected',
            payload: { callId: inc.callId },
          }).catch(() => {});
        }
      });

      // 2. Send to caller's inbox
      const callerCh = supabase.channel(`user:${inc.callerId}`);
      callerCh.subscribe((st) => {
        if (st === 'SUBSCRIBED') {
          callerCh.send({
            type: 'broadcast',
            event: 'call-rejected',
            payload: { callId: inc.callId },
          }).catch(() => {});
        }
      });

      setIncomingCall(null);
      incomingCallRef.current = null;
    }
  };

  const handleEndCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    const sess = activeCallSessionRef.current || activeCallSession;
    if (sess) {
      sess.terminate('call-ended');
      setActiveCallSession(null);
      activeCallSessionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('ended');
    setCallDuration(0);
    setCallPartner(null);
    setTimeout(() => {
      setCallStatus('calling');
    }, 600);
  };

  // 15. Message Forwarding
  const handleForwardMessage = async (targetChatId: string, msg: Message) => {
    if (!currentUser) return;
    try {
      const mappedMedia = msg.media?.map((m: any) => ({
        storagePath: m.storage_path || m.storagePath,
        fileName: m.file_name || m.fileName,
        mimeType: m.mime_type || m.mimeType,
        fileSize: m.file_size || m.fileSize || 0,
        duration: m.duration || undefined,
      }));

      const mappedPoll = msg.poll
        ? {
            question: msg.poll.question,
            options: msg.poll.options.map((opt: any) =>
              typeof opt === 'string' ? opt : opt.option_text
            ),
            isMultipleChoice: msg.poll.is_multiple_choice,
          }
        : undefined;

      const mappedLocation = msg.location
        ? {
            latitude: Number(msg.location.latitude),
            longitude: Number(msg.location.longitude),
            address: msg.location.address || undefined,
          }
        : undefined;

      const mappedContact = msg.contact
        ? {
            contactUserId: msg.contact.contact_user_id || undefined,
            contactName: msg.contact.contact_name,
            contactPhone: msg.contact.contact_phone || undefined,
          }
        : undefined;

      const sent = await messageService.sendMessage({
        chatId: targetChatId,
        senderId: currentUser.id,
        messageType: msg.message_type,
        text: msg.text || '',
        media: mappedMedia,
        location: mappedLocation,
        contact: mappedContact,
        poll: mappedPoll,
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === targetChatId
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );

      if (selectedChatIdRef.current === targetChatId) {
        setMessages((prev) => [...prev, sent]);
      }

      setSelectedChatId(targetChatId);
      broadcastNewMessage(sent, targetChatId);
    } catch (err: any) {
      alert(err?.message || 'Failed to forward message');
    }
  };

  // 16. Pin & Star Message Handlers
  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    if (!selectedChatId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_pinned: isPinned } : m))
    );
    try {
      await messageService.pinMessage(messageId, isPinned);
      const ch = supabase.channel(`chat_room:${selectedChatId}`);
      ch.send({
        type: 'broadcast',
        event: 'message:pinned',
        payload: { messageId, is_pinned: isPinned },
      });
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  const handleStarMessage = async (messageId: string, isStarred: boolean) => {
    if (!selectedChatId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_starred: isStarred } : m))
    );
    try {
      await messageService.starMessage(messageId, isStarred);
    } catch (err) {
      console.error('Failed to star message:', err);
    }
  };

  // 17. Status Reply Handler
  const handleReplyToStatus = async (targetUserId: string, replyText: string) => {
    if (!currentUser) return;
    try {
      const chatId = await chatService.createDirectChat(currentUser.id, targetUserId);
      const sent = await messageService.sendMessage({
        chatId,
        senderId: currentUser.id,
        messageType: 'text',
        text: replyText,
      });

      const updated = await chatService.getChats(currentUser.id);
      setChats(updated);

      if (selectedChatIdRef.current === chatId) {
        setMessages((prev) => [...prev, sent]);
      }

      broadcastNewMessage(sent, chatId);
    } catch (err) {
      console.error('Failed to reply to status:', err);
    }
  };

  // 18. Group Management Handlers (Admin Only)
  const handleAddMemberToGroup = async (userId: string) => {
    if (!selectedChatId || !currentUser) return;
    try {
      await chatService.addMemberToGroup(selectedChatId, userId);
      const addedProfile = await userService.getProfile(userId);
      const memberName = addedProfile?.full_name || 'A new member';
      const actorName = currentUser.full_name || 'Admin';

      // Post system announcement message
      const activityMsg = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        messageType: 'text',
        text: `📢 ${actorName} added ${memberName} to the group`,
      });

      setMessages((prev) => [...prev, activityMsg]);

      const refreshed = await chatService.getChats(currentUser.id);
      setChats(refreshed);

      const channel = supabase.channel(`chat_room:${selectedChatId}`);
      channel.send({
        type: 'broadcast',
        event: 'member:change',
        payload: { action: 'add', userId },
      });
      broadcastNewMessage(activityMsg, selectedChatId);

      // Notify user's channel so their chat list updates in realtime without refresh
      const userCh = supabase.channel(`user:${userId}`);
      userCh.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          userCh.send({
            type: 'broadcast',
            event: 'group:joined',
            payload: { chatId: selectedChatId },
          });
        }
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to add member');
    }
  };

  const handleRemoveMemberFromGroup = async (userId: string) => {
    if (!selectedChatId || !currentUser) return;
    try {
      const removedProfile = await userService.getProfile(userId);
      const memberName = removedProfile?.full_name || 'A member';
      const actorName = currentUser.full_name || 'Admin';

      await chatService.removeMemberFromGroup(selectedChatId, userId);

      const activityMsg = await messageService.sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.id,
        messageType: 'text',
        text: `📢 ${actorName} removed ${memberName} from the group`,
      });

      setMessages((prev) => [...prev, activityMsg]);

      const refreshed = await chatService.getChats(currentUser.id);
      setChats(refreshed);

      const channel = supabase.channel(`chat_room:${selectedChatId}`);
      channel.send({
        type: 'broadcast',
        event: 'member:change',
        payload: { action: 'remove', userId },
      });
      broadcastNewMessage(activityMsg, selectedChatId);
    } catch (err: any) {
      alert(err?.message || 'Failed to remove member');
    }
  };

  const handleUpdateGroupPhoto = async (file: File) => {
    if (!selectedChatId || !currentUser) return;
    try {
      const res = await storageService.uploadChatMedia(file, selectedChatId, 'image');
      await chatService.updateGroupInfo(selectedChatId, { photoUrl: res.publicUrl });
      const refreshed = await chatService.getChats(currentUser.id);
      setChats(refreshed);
      const channel = supabase.channel(`chat_room:${selectedChatId}`);
      channel.send({
        type: 'broadcast',
        event: 'member:change',
        payload: { action: 'photo', photoUrl: res.publicUrl },
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to update group photo');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    localStorage.removeItem('demo_active_user');
    await authService.logout();
    router.push('/auth/login');
  };

  // Handle start direct chat with any user from search/modal
  const handleStartDirectChat = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const chatId = await chatService.createDirectChat(currentUser.id, targetUserId);
      const updated = await chatService.getChats(currentUser.id);
      setChats(updated);
      setSelectedChatId(chatId);
    } catch (err) {
      console.error('Failed to start direct chat:', err);
    }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  if (loadingAuth || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Offline / Online Persistent Network Banner & Toast */}
      {(!isOnlineNetwork || offlineQueueCount > 0 || showNetworkToast) && (
        <div
          className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-medium shadow-2xl backdrop-blur-md animate-fade-in transition-all ${
            !isOnlineNetwork
              ? 'bg-amber-600/95 text-white border border-amber-400/40'
              : 'bg-emerald-600/95 text-white border border-emerald-400/40'
          }`}
        >
          {!isOnlineNetwork ? (
            <>
              <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
              <span>
                {toastText || (
                  <>
                    Offline &bull; Messages cached in memory
                    {offlineQueueCount > 0 && ` (${offlineQueueCount} queued)`}
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={toggleOfflineSimulation}
                className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[11px] font-semibold transition-colors"
                title="Simulate network reconnect to auto-send cached messages"
              >
                Reconnect ↗
              </button>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{toastText || 'Online • Messenger Connected'}</span>
              <button
                type="button"
                onClick={toggleOfflineSimulation}
                className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[11px] font-semibold transition-colors"
                title="Simulate offline mode for college project evaluation"
              >
                Test Offline
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Responsive Layout */}
      {/* 1. Left Sidebar: ChatList */}
      <div
        className={`w-full md:w-80 lg:w-96 h-full flex flex-col shrink-0 ${
          selectedChatId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={(id) => setSelectedChatId(id)}
          currentUser={currentUser}
          onOpenNewChat={() => setShowNewChat(true)}
          onOpenNewGroup={() => setShowNewGroup(true)}
          onOpenStatus={() => setShowStatusModal(true)}
          onOpenCreateStatus={() => setShowCreateStatusModal(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenNotifications={() => setShowNotifications(true)}
          onlineUserIds={onlineUserIds}
          typingChatIds={typingChatIds}
          onStartDirectChat={handleStartDirectChat}
        />
      </div>

      {/* 2. Center View: ChatArea */}
      <div
        className={`flex-1 h-full flex flex-col min-w-0 ${
          !selectedChatId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatArea
          chat={selectedChat}
          currentUser={currentUser}
          allChats={chats}
          messages={messages}
          isOnline={onlineUserIds.includes(
            selectedChat?.members?.find((m) => m.user_id !== currentUser.id)?.user_id || ''
          )}
          isTyping={typingChatIds.includes(selectedChat?.id || '')}
          onSendMessage={handleSendMessage}
          onSendMedia={handleSendMedia}
          onSendVoice={handleSendVoice}
          onSendSticker={handleSendSticker}
          onSendPoll={handleSendPoll}
          onSendLocation={handleSendLocation}
          onSendContact={handleSendContact}
          onForwardMessage={handleForwardMessage}
          onEditMessage={handleEditMessage}
          onDeleteForEveryone={handleDeleteForEveryone}
          onDeleteForMe={handleDeleteForMe}
          onReact={handleReact}
          onStar={handleStarMessage}
          onPin={handlePinMessage}
          onVotePoll={handleVotePoll}
          onTyping={(typing) => {
            const ch = supabase.channel(`chat_room:${selectedChatId}`);
            ch.send({
              type: 'broadcast',
              event: typing ? 'typing:start' : 'typing:stop',
            });
          }}
          onStartAudioCall={() => handleStartCall('audio')}
          onStartVideoCall={() => handleStartCall('video')}
          onBackMobile={() => setSelectedChatId(null)}
          onAddMember={handleAddMemberToGroup}
          onRemoveMember={handleRemoveMemberFromGroup}
          onUpdateGroupPhoto={handleUpdateGroupPhoto}
          onStartDirectChat={handleStartDirectChat}
        />
      </div>

      {/* MODALS */}
      {/* 1. New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          isOpen={showNewChat}
          onClose={() => setShowNewChat(false)}
          currentUserId={currentUser.id}
          onStartChat={async (tId) => {
            await handleStartDirectChat(tId);
            setShowNewChat(false);
          }}
        />
      )}

      {/* 2. New Group Modal */}
      {showNewGroup && (
        <CreateGroupModal
          isOpen={showNewGroup}
          onClose={() => setShowNewGroup(false)}
          currentUserId={currentUser.id}
          onCreateGroup={async (data) => {
            let photoUrl = undefined;
            if (data.photoFile) {
              const res = await storageService.uploadChatMedia(data.photoFile, 'groups', 'image');
              photoUrl = res.publicUrl;
            }
            const chatId = await chatService.createGroupChat(currentUser.id, {
              name: data.name,
              description: data.description,
              photoUrl,
              memberIds: data.memberIds,
            });
            const updated = await chatService.getChats(currentUser.id);
            setChats(updated);
            setSelectedChatId(chatId);
          }}
        />
      )}

      {/* 3. 24h Status Story Modal */}
      {showStatusModal && (
        <StatusModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          statuses={statuses}
          currentUserId={currentUser.id}
          onViewStatus={(sId) => userService.viewStatus(sId, currentUser.id)}
          onOpenCreateStatus={() => setShowCreateStatusModal(true)}
          onReplyToStatus={handleReplyToStatus}
        />
      )}

      {/* 4. Post New Status */}
      {showCreateStatusModal && (
        <CreateStatusModal
          isOpen={showCreateStatusModal}
          onClose={() => setShowCreateStatusModal(false)}
          onPostStatus={async (data) => {
            let mediaUrl = undefined;
            if (data.mediaFile) {
              const res = await storageService.uploadChatMedia(data.mediaFile, 'status', 'image');
              mediaUrl = res.publicUrl;
            }
            await userService.createStatus({
              userId: currentUser.id,
              statusType: data.statusType,
              content: data.content,
              backgroundColor: data.backgroundColor,
              mediaUrl,
            });
            const updatedStories = await userService.getStatuses();
            setStatuses(updatedStories);
          }}
        />
      )}

      {/* 5. User Profile & Settings */}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          currentUser={currentUser}
          onUpdateProfile={async (name, username, bio, avatarFile) => {
            let avatarUrl = currentUser.avatar_url;
            if (avatarFile) {
              avatarUrl = await storageService.uploadAvatar(avatarFile, currentUser.id);
            }
            await userService.updateProfile(currentUser.id, {
              full_name: name,
              username,
              bio,
              avatar_url: avatarUrl,
            });
            const updatedProfile: Profile = {
              ...currentUser,
              full_name: name,
              username,
              bio,
              avatar_url: avatarUrl,
            };
            setCurrentUser(updatedProfile);
            setLocalActiveUser(updatedProfile);
            const updatedChats = await chatService.getChats(currentUser.id);
            setChats(updatedChats);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* 6. Notifications Drawer */}
      {showNotifications && (
        <NotificationDrawer
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={notifications}
          onMarkRead={(id) => {
            notificationService.markAsRead(id);
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
          }}
          onMarkAllRead={() => {
            notificationService.markAllAsRead(currentUser.id);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
          }}
        />
      )}

      {/* 7. Active WebRTC Call Window */}
      {activeCallSession && (
        <CallModal
          callId={activeCallSession.callId}
          calleeName={callPartner?.name || 'In Call'}
          calleeAvatar={callPartner?.avatar}
          callType={activeCallSession.callType}
          status={callStatus}
          localStream={localStream}
          remoteStream={remoteStream}
          durationSeconds={callDuration}
          onToggleMic={(muted) => activeCallSession.toggleAudio(!muted)}
          onToggleVideo={(vOn) => activeCallSession.toggleVideo(vOn)}
          onEndCall={handleEndCall}
        />
      )}

      {/* 8. Incoming Call Ringing Dialog */}
      {incomingCall && (
        <IncomingCallBanner
          callerName={incomingCall.callerProfile?.full_name || 'Incoming Caller'}
          callerAvatar={incomingCall.callerProfile?.avatar_url}
          callType={incomingCall.callType}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}
    </div>
  );
}
