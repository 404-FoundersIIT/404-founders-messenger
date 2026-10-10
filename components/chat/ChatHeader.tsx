'use client';

import React from 'react';
import { Chat, Profile } from '@/types/database';
import { Avatar } from '@/components/ui/Avatar';
import { formatLastSeen } from '@/lib/utils';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  ArrowLeft,
  Users,
} from 'lucide-react';

interface ChatHeaderProps {
  chat: Chat;
  currentUser: Profile;
  isOnline?: boolean;
  isTyping?: boolean;
  onBackMobile?: () => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onToggleSearch: () => void;
  onToggleDetails: () => void;
}

export function ChatHeader({
  chat,
  currentUser,
  isOnline = false,
  isTyping = false,
  onBackMobile,
  onStartAudioCall,
  onStartVideoCall,
  onToggleSearch,
  onToggleDetails,
}: ChatHeaderProps) {
  const displayName = chat.name || (chat.is_group ? 'Group Chat' : 'Chat');
  const memberCount = chat.members?.length || 2;

  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 select-none z-10">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile Back Button */}
        {onBackMobile && (
          <button
            type="button"
            onClick={onBackMobile}
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="cursor-pointer" onClick={onToggleDetails}>
          <Avatar
            name={displayName}
            src={chat.photo_url}
            size="md"
            isOnline={!chat.is_group ? isOnline : undefined}
          />
        </div>

        <div className="min-w-0 cursor-pointer" onClick={onToggleDetails}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {displayName}
          </h3>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {isTyping ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                typing...
              </span>
            ) : chat.is_group ? (
              <span>{memberCount} participants</span>
            ) : isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
            ) : (
              <span>{formatLastSeen(chat.updated_at)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={onStartAudioCall}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
          title="Audio call"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onStartVideoCall}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
          title="Video call"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggleSearch}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
          title="Search in conversation"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggleDetails}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
          title="Chat info"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
