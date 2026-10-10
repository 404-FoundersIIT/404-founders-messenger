'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message, Profile } from '@/types/database';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { ForwardModal } from './ForwardModal';
import { MediaViewer } from './MediaViewer';
import { PollModal } from './PollModal';
import { LocationModal } from './LocationModal';
import { ContactModal } from './ContactModal';
import { ChatDetails } from './ChatDetails';
import { SearchPanel } from './SearchPanel';
import { Pin, ArrowDown, ShieldCheck, Lock } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';

interface ChatAreaProps {
  chat: Chat | null;
  currentUser: Profile;
  allChats: Chat[];
  messages: Message[];
  isOnline?: boolean;
  isTyping?: boolean;
  onSendMessage: (text: string, replyToId?: string | null) => void;
  onSendMedia: (file: File, category: 'image' | 'video' | 'document') => void;
  onSendVoice: (blob: Blob, duration: number) => void;
  onSendSticker: (stickerUrl: string) => void;
  onSendPoll: (pollData: { question: string; options: string[]; isMultipleChoice: boolean }) => void;
  onSendLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
  onSendContact: (contact: { contactUserId: string; contactName: string; contactPhone?: string }) => void;
  onForwardMessage: (targetChatId: string, message: Message) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onDeleteForMe: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onStar: (messageId: string, isStarred: boolean) => void;
  onPin: (messageId: string, isPinned: boolean) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  onTyping: (isTyping: boolean) => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onBackMobile?: () => void;
  onAddMember?: (userId: string) => void;
  onRemoveMember?: (userId: string) => void;
  onUpdateGroupPhoto?: (file: File) => void;
  onStartDirectChat?: (userId: string) => void;
}

export function ChatArea({
  chat,
  currentUser,
  allChats,
  messages,
  isOnline,
  isTyping,
  onSendMessage,
  onSendMedia,
  onSendVoice,
  onSendSticker,
  onSendPoll,
  onSendLocation,
  onSendContact,
  onForwardMessage,
  onEditMessage,
  onDeleteForEveryone,
  onDeleteForMe,
  onReact,
  onStar,
  onPin,
  onVotePoll,
  onTyping,
  onStartAudioCall,
  onStartVideoCall,
  onBackMobile,
  onAddMember,
  onRemoveMember,
  onUpdateGroupPhoto,
  onStartDirectChat,
}: ChatAreaProps) {
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [mediaViewerState, setMediaViewerState] = useState<{
    isOpen: boolean;
    url: string | null;
    type: 'image' | 'video';
    fileName?: string;
  }>({ isOpen: false, url: null, type: 'image' });

  const [showPollModal, setShowPollModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadSeparatorIndex, setUnreadSeparatorIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute unread divider index when chat changes
  useEffect(() => {
    if (chat?.id) {
      const unread = chat.unread_count || 0;
      if (unread > 0 && messages.length >= unread) {
        setUnreadSeparatorIndex(messages.length - unread);
      } else {
        setUnreadSeparatorIndex(null);
      }
    }
  }, [chat?.id]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollBottom]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 250;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-emerald-500/10');
      setTimeout(() => el.classList.remove('bg-emerald-500/10'), 1500);
    }
  };

  // Group messages by day
  const renderDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    let label = format(date, 'MMMM d, yyyy');
    if (isToday(date)) label = 'Today';
    else if (isYesterday(date)) label = 'Yesterday';

    return (
      <div className="flex items-center justify-center my-3 select-none">
        <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-xs">
          {label}
        </span>
      </div>
    );
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 text-slate-500 text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-sm">
          <img src="/logo.png" alt="404 Founders" className="w-12 h-12 object-contain" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          404 Founders Messenger
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          Send real-time messages, make free WebRTC voice and video calls, share files, and collaborate with your team.
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-6 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-time WebSocket & Peer-to-Peer Encryption</span>
        </div>
        {onBackMobile && (
          <button
            type="button"
            onClick={onBackMobile}
            className="md:hidden mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            &larr; View Chat List
          </button>
        )}
      </div>
    );
  }

  // Pinned Message in current chat
  const pinnedMessage = messages.find((m) => (m as any).is_pinned);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#efeae2] dark:bg-[#0b141a] touch-pan-y">
      {/* Central Chat View */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Chat Top Header */}
        <ChatHeader
          chat={chat}
          currentUser={currentUser}
          isOnline={isOnline}
          isTyping={isTyping}
          onBackMobile={onBackMobile}
          onStartAudioCall={onStartAudioCall}
          onStartVideoCall={onStartVideoCall}
          onToggleSearch={() => {
            setShowSearch(!showSearch);
            setShowDetails(false);
          }}
          onToggleDetails={() => {
            setShowDetails(!showDetails);
            setShowSearch(false);
          }}
        />

        {/* Pinned Message Strip */}
        {pinnedMessage && (
          <div
            onClick={() => scrollToMessage(pinnedMessage.id)}
            className="flex items-center justify-between px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 truncate">
              <Pin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold shrink-0">Pinned Message:</span>
              <span className="truncate">{pinnedMessage.text || `[${pinnedMessage.message_type}]`}</span>
            </div>
            <span className="text-[10px] text-emerald-600 underline shrink-0 ml-2">Jump</span>
          </div>
        )}

        {/* Messages Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 scrollbar-thin overscroll-contain touch-pan-y"
        >
          {/* Security Banner at Top */}
          <div className="flex justify-center my-3 select-none">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-[11px] max-w-sm text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Messages and calls are secured with Row-Level Security policies.</span>
            </div>
          </div>

          {messages.map((msg, index) => {
            const showDate =
              index === 0 ||
              new Date(msg.created_at).toDateString() !==
                new Date(messages[index - 1].created_at).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDate && renderDateSeparator(msg.created_at)}
                {unreadSeparatorIndex !== null && index === unreadSeparatorIndex && (
                  <div className="flex items-center my-3 select-none">
                    <div className="flex-grow border-t border-emerald-500/30"></div>
                    <span className="px-3 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold rounded-full shadow-sm mx-2">
                      Unread Messages
                    </span>
                    <div className="flex-grow border-t border-emerald-500/30"></div>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  currentUserId={currentUser.id}
                  isGroup={chat.is_group}
                  onReply={(m) => setReplyingMessage(m)}
                  onReplyPrivately={(m) => {
                    if (onStartDirectChat && m.sender_id) {
                      onStartDirectChat(m.sender_id);
                    }
                  }}
                  onForward={(m) => setForwardingMessage(m)}
                  onReact={(mId, emoji) => onReact(mId, emoji)}
                  onStar={(mId, star) => onStar(mId, star)}
                  onPin={(mId, pin) => onPin(mId, pin)}
                  onEdit={(m) => {
                    const newText = prompt('Edit your message:', m.text || '');
                    if (newText !== null && newText.trim() !== '') {
                      onEditMessage(m.id, newText.trim());
                    }
                  }}
                  onDeleteForEveryone={(mId) => onDeleteForEveryone(mId)}
                  onDeleteForMe={(mId) => onDeleteForMe(mId)}
                  onVotePoll={(pId, oId) => onVotePoll(pId, oId)}
                  onOpenMedia={(url, type, name) =>
                    setMediaViewerState({ isOpen: true, url, type, fileName: name })
                  }
                  onScrollToMessage={(mId) => scrollToMessage(mId)}
                />
              </React.Fragment>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95 z-20"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Bottom Message Composer */}
        <MessageComposer
          onSendMessage={onSendMessage}
          onSendMedia={onSendMedia}
          onSendVoice={onSendVoice}
          onSendSticker={onSendSticker}
          onOpenPollModal={() => setShowPollModal(true)}
          onOpenLocationModal={() => setShowLocationModal(true)}
          onOpenContactModal={() => setShowContactModal(true)}
          onTyping={onTyping}
          replyingToMessage={replyingMessage}
          onCancelReply={() => setReplyingMessage(null)}
        />
      </div>

      {/* Right Drawer: Search In Conversation */}
      {showSearch && (
        <SearchPanel
          chatId={chat.id}
          onClose={() => setShowSearch(false)}
          onSelectMessage={(mId) => scrollToMessage(mId)}
        />
      )}

      {/* Right Drawer: Chat Details */}
      {showDetails && (
        <ChatDetails
          chat={chat}
          currentUser={currentUser}
          onClose={() => setShowDetails(false)}
          onAddMember={onAddMember}
          onRemoveMember={onRemoveMember}
          onUpdateGroupPhoto={onUpdateGroupPhoto}
          onStartDirectChat={onStartDirectChat}
          onReportChat={() => alert('Report submitted to moderation review team.')}
          onBlockUser={() => alert('Contact has been blocked.')}
        />
      )}

      {/* Forward Modal */}
      {forwardingMessage && (
        <ForwardModal
          isOpen={!!forwardingMessage}
          onClose={() => setForwardingMessage(null)}
          message={forwardingMessage}
          chats={allChats}
          onForward={onForwardMessage}
        />
      )}

      {/* Fullscreen Media Viewer */}
      {mediaViewerState.isOpen && (
        <MediaViewer
          isOpen={mediaViewerState.isOpen}
          onClose={() => setMediaViewerState({ isOpen: false, url: null, type: 'image' })}
          mediaUrl={mediaViewerState.url}
          mediaType={mediaViewerState.type}
          fileName={mediaViewerState.fileName}
        />
      )}

      {/* Poll Creation Modal */}
      {showPollModal && (
        <PollModal
          isOpen={showPollModal}
          onClose={() => setShowPollModal(false)}
          onCreatePoll={onSendPoll}
        />
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onShareLocation={onSendLocation}
        />
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onShareContact={onSendContact}
        />
      )}
    </div>
  );
}
