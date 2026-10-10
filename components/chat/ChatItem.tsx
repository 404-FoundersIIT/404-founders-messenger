'use client';

import React from 'react';
import { Chat } from '@/types/database';
import { Avatar } from '@/components/ui/Avatar';
import { formatChatTimestamp } from '@/lib/utils';
import { Pin, VolumeX, Users, CheckCheck } from 'lucide-react';

interface ChatItemProps {
  chat: Chat;
  isSelected?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
  onClick: () => void;
}

export function ChatItem({
  chat,
  isSelected = false,
  isOnline = false,
  isTyping = false,
  onClick,
}: ChatItemProps) {
  const displayName = chat.name || (chat.is_group ? 'Group Chat' : 'Chat');
  const lastMsg = chat.last_message;
  const isMuted = (chat as any).is_muted;
  const isPinned = (chat as any).is_pinned;
  const unreadCount = chat.unread_count || 0;

  let snippet = lastMsg?.text || (lastMsg ? `[${lastMsg.message_type}]` : 'No messages yet');
  if (lastMsg?.is_deleted) snippet = 'This message was deleted';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer select-none transition-colors relative border-b border-slate-100 dark:border-slate-800/60 ${
        isSelected
          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-l-emerald-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="relative shrink-0">
        <Avatar
          name={displayName}
          src={chat.photo_url}
          size="md"
          isOnline={!chat.is_group ? isOnline : undefined}
        />
        {chat.is_group && (
          <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            <Users className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {displayName}
            </h4>
            {!chat.is_group && isOnline && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs ring-1 ring-emerald-400/50" title="Online" />
            )}
          </div>
          <span className="text-[11px] text-slate-400 shrink-0 ml-2">
            {formatChatTimestamp(lastMsg?.created_at || chat.updated_at)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="truncate pr-2 text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {isTyping ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                typing...
              </span>
            ) : (
              <span>{snippet}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isMuted && <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            {isPinned && <Pin className="w-3.5 h-3.5 text-slate-400" />}
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white min-w-4 text-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
