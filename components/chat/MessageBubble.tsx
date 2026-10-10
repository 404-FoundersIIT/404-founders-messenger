'use client';

import React, { useState } from 'react';
import { Message, Profile } from '@/types/database';
import { formatMessageTime, formatFileSize } from '@/lib/utils';
import { MessageReceipt } from './MessageReceipt';
import { ReactionPicker } from './ReactionPicker';
import { PollCard } from './PollCard';
import {
  FileText,
  Download,
  MapPin,
  User as UserIcon,
  Play,
  Pause,
  Smile,
  Reply,
  Forward,
  Star,
  Pin,
  Trash2,
  Edit2,
  MoreVertical,
  CornerUpLeft,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  isGroup?: boolean;
  onReply?: (message: Message) => void;
  onReplyPrivately?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onStar?: (messageId: string, isStarred: boolean) => void;
  onPin?: (messageId: string, isPinned: boolean) => void;
  onEdit?: (message: Message) => void;
  onDeleteForEveryone?: (messageId: string) => void;
  onDeleteForMe?: (messageId: string) => void;
  onVotePoll?: (pollId: string, optionId: string) => void;
  onOpenMedia?: (url: string, type: 'image' | 'video', fileName?: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export function renderFormattedText(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 dark:text-emerald-400 underline font-medium hover:opacity-80 break-all inline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function MessageBubble({
  message,
  currentUserId,
  isGroup = false,
  onReply,
  onReplyPrivately,
  onForward,
  onReact,
  onStar,
  onPin,
  onEdit,
  onDeleteForEveryone,
  onDeleteForMe,
  onVotePoll,
  onOpenMedia,
  onScrollToMessage,
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const isOutgoing = message.sender_id === currentUserId;
  const isDeleted = message.is_deleted;
  const isDeletedForMe = message.deleted_for_users?.includes(currentUserId);

  if (isDeletedForMe) {
    return null;
  }

  // Audio Playback
  const handleToggleAudio = (url: string) => {
    const audioEl = document.getElementById(`audio-${message.id}`) as HTMLAudioElement;
    if (!audioEl) return;

    if (isPlayingAudio) {
      audioEl.pause();
      setIsPlayingAudio(false);
    } else {
      audioEl.play();
      setIsPlayingAudio(true);
    }
  };

  // Direct file downloader
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Group reactions by emoji
  const reactionsMap = (message.reactions || []).reduce((acc: { [emoji: string]: number }, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex w-full my-1 px-4 ${
        isOutgoing ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Quick Action Floating Bar on Hover */}
      {!isDeleted && (
        <div
          className={`absolute -top-3 z-20 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 rounded-full px-1 py-0.5 animate-fade-in ${
            isOutgoing ? 'right-6' : 'left-6'
          }`}
        >
          {onReact && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 hover:text-emerald-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                title="React"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
              {showReactions && (
                <div className="absolute bottom-7 left-0 z-30">
                  <ReactionPicker
                    onSelectEmoji={(emoji) => {
                      onReact(message.id, emoji);
                      setShowReactions(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {onReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              className="p-1 hover:text-emerald-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}

          {onForward && (
            <button
              type="button"
              onClick={() => onForward(message)}
              className="p-1 hover:text-emerald-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              title="Forward"
            >
              <Forward className="w-3.5 h-3.5" />
            </button>
          )}

          {/* More actions menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:text-emerald-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              title="More"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                className={`absolute bottom-7 ${
                  isOutgoing ? 'right-0' : 'left-0'
                } w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 text-xs`}
              >
                {onStar && (
                  <button
                    onClick={() => {
                      onStar(message.id, !(message as any).is_starred);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500" /> {(message as any).is_starred ? 'Unstar message' : 'Star message'}
                  </button>
                )}
                {onPin && (
                  <button
                    onClick={() => {
                      onPin(message.id, !(message as any).is_pinned);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <Pin className="w-3.5 h-3.5 text-emerald-600" /> {(message as any).is_pinned ? 'Unpin message' : 'Pin message'}
                  </button>
                )}
                {isGroup && !isOutgoing && onReplyPrivately && (
                  <button
                    onClick={() => {
                      onReplyPrivately(message);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" /> Reply privately
                  </button>
                )}
                {isOutgoing && onEdit && message.message_type === 'text' && (
                  <button
                    onClick={() => {
                      onEdit(message);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit message
                  </button>
                )}
                {onDeleteForMe && (
                  <button
                    onClick={() => {
                      onDeleteForMe(message.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete for me
                  </button>
                )}
                {isOutgoing && onDeleteForEveryone && (
                  <button
                    onClick={() => {
                      onDeleteForEveryone(message.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm text-sm ${
          message.message_type === 'sticker'
            ? 'bg-transparent shadow-none p-0'
            : isOutgoing
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-sm'
            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-sm border border-slate-100 dark:border-slate-800'
        }`}
      >
        {/* Forwarded Header */}
        {message.forwarded_from_message_id && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 italic mb-1">
            <CornerUpLeft className="w-3 h-3 rotate-180" /> Forwarded
          </div>
        )}

        {/* Sender Name in Groups */}
        {!isOutgoing && isGroup && message.sender && (
          <div className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
            {message.sender.full_name}
          </div>
        )}

        {/* Reply Quote Banner */}
        {message.reply_to && (
          <div
            onClick={() => onScrollToMessage && onScrollToMessage(message.reply_to!.id)}
            className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-black/20 border-l-4 border-emerald-500 cursor-pointer text-xs"
          >
            <div className="font-semibold text-emerald-600 dark:text-emerald-400">
              {message.reply_to.sender?.full_name || 'Original Message'}
            </div>
            <div className="text-slate-600 dark:text-slate-300 truncate">
              {message.reply_to.text || `[${message.reply_to.message_type}]`}
            </div>
          </div>
        )}

        {/* Deleted Message State */}
        {isDeleted ? (
          <div className="flex items-center gap-1.5 italic text-slate-500 dark:text-slate-400 text-xs py-0.5">
            <Trash2 className="w-3.5 h-3.5 opacity-60" />
            <span>This message was deleted</span>
          </div>
        ) : (
          <>
            {/* 1. TEXT MESSAGE */}
            {message.text && message.message_type === 'text' && (
              <div className="whitespace-pre-wrap break-words leading-relaxed select-text">
                {renderFormattedText(message.text)}
              </div>
            )}

            {/* 2. MEDIA: IMAGE */}
            {message.message_type === 'image' && message.media?.[0] && (
              <div className="space-y-1.5 my-0.5">
                <img
                  src={message.media[0].storage_path}
                  alt="attached"
                  onClick={() =>
                    onOpenMedia &&
                    onOpenMedia(message.media![0].storage_path, 'image', message.media![0].file_name)
                  }
                  className="rounded-xl max-h-72 w-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                />
                {message.text && (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{renderFormattedText(message.text)}</p>
                )}
              </div>
            )}

            {/* 3. MEDIA: VIDEO */}
            {message.message_type === 'video' && message.media?.[0] && (
              <div className="space-y-1.5 my-0.5">
                <video
                  src={message.media[0].storage_path}
                  controls
                  className="rounded-xl max-h-72 w-full object-cover"
                />
                {message.text && (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{renderFormattedText(message.text)}</p>
                )}
              </div>
            )}

            {/* 4. MEDIA: AUDIO / VOICE MESSAGE */}
            {message.message_type === 'voice' && (
              (() => {
                const voiceUrl = message.media?.[0]?.storage_path || (message.text?.startsWith('http') ? message.text : null);
                if (!voiceUrl) return null;
                return (
                  <div className="flex items-center gap-3 py-1 min-w-[200px]">
                    <audio
                      id={`audio-${message.id}`}
                      src={voiceUrl}
                      onTimeUpdate={(e) => {
                        const el = e.currentTarget;
                        if (el.duration) {
                          setAudioProgress((el.currentTime / el.duration) * 100);
                        }
                      }}
                      onEnded={() => {
                        setIsPlayingAudio(false);
                        setAudioProgress(0);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleAudio(voiceUrl)}
                      className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shrink-0"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-200"
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Voice note {message.media?.[0]?.duration ? `(${message.media[0].duration}s)` : ''}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* 5. MEDIA: DOCUMENT */}
            {message.message_type === 'document' && message.media?.[0] && (
              <div className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl min-w-[220px]">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{message.media[0].file_name}</div>
                  <div className="text-[10px] text-slate-500">
                    {formatFileSize(message.media[0].file_size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(message.media![0].storage_path, message.media![0].file_name)}
                  className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 6. STICKER */}
            {message.message_type === 'sticker' && message.text && (
              <div className="p-1">
                <img
                  src={message.text}
                  alt="sticker"
                  className="w-28 h-28 object-contain pointer-events-none drop-shadow-sm"
                />
              </div>
            )}

            {/* 7. SHARED LOCATION */}
            {message.message_type === 'location' && message.location && (
              <div className="space-y-2 min-w-[220px]">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${message.location.latitude}&mlon=${message.location.longitude}#map=16/${message.location.latitude}/${message.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group/map"
                >
                  <div className="h-28 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 relative">
                    <MapPin className="w-6 h-6 text-red-500 group-hover/map:scale-125 transition-transform" />
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {message.location.address || 'Shared Location'}
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">Open in OpenStreetMap</div>
                  </div>
                </a>
              </div>
            )}

            {/* 8. SHARED CONTACT */}
            {message.message_type === 'contact' && message.contact && (
              <div className="flex items-center gap-3 p-2.5 bg-black/5 dark:bg-white/5 rounded-xl min-w-[200px]">
                <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{message.contact.contact_name}</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {message.contact.contact_phone}
                  </div>
                </div>
              </div>
            )}

            {/* 9. POLL */}
            {message.message_type === 'poll' && message.poll && (
              <PollCard
                poll={message.poll}
                currentUserId={currentUserId}
                onVote={(pollId, optId) => onVotePoll && onVotePoll(pollId, optId)}
              />
            )}
          </>
        )}

        {/* Message Meta Info: Timestamp, Edited tag, Receipts, Star & Pin Badges */}
        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1 select-none">
          {(message as any).is_pinned && <Pin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
          {(message as any).is_starred && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />}
          {message.is_edited && !isDeleted && <span>(edited)</span>}
          <span>{formatMessageTime(message.created_at)}</span>
          <MessageReceipt
            isOutgoing={isOutgoing}
            isPending={(message as any).is_pending}
            isDelivered={!(message as any).is_pending}
            isRead={message.receipts?.some((r) => !!r.read_at || (r as any).status === 'read')}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            className="sm:hidden p-0.5 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Message options"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>

        {/* Reaction Chips */}
        {Object.keys(reactionsMap).length > 0 && (
          <div className="absolute -bottom-2.5 left-2 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.5 shadow-sm text-[11px] z-10">
            {Object.entries(reactionsMap).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-0.5">
                <span>{emoji}</span>
                {count > 1 && <span className="text-[10px] text-slate-500">{count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
