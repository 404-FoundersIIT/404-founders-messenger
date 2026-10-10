'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Chat, Profile } from '@/types/database';
import { ChatItem } from './ChatItem';
import { Avatar } from '@/components/ui/Avatar';
import { userService } from '@/services/userService';
import {
  Search,
  Users,
  MessageSquarePlus,
  Radio,
  Bell,
  UserCheck,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: Profile;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenStatus: () => void;
  onOpenCreateStatus?: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onlineUserIds: string[];
  typingChatIds: string[];
  onStartDirectChat?: (targetUserId: string) => void;
}

export function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  currentUser,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenStatus,
  onOpenCreateStatus,
  onOpenSettings,
  onOpenNotifications,
  onlineUserIds,
  typingChatIds,
  onStartDirectChat,
}: ChatListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups' | 'users'>('all');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  // Fetch real users from PostgreSQL database
  useEffect(() => {
    userService.getAllProfiles().then((profiles) => {
      setAllUsers(profiles);
    });
  }, []);

  // Filter existing active chats
  const filteredChats = useMemo(() => {
    return chats
      .filter((chat) => {
        const name = (chat.name || '').toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'unread') return (chat.unread_count || 0) > 0;
        if (filter === 'groups') return chat.is_group;
        return true;
      })
      .sort((a, b) => {
        const aPinned = (a as any).is_pinned ? 1 : 0;
        const bPinned = (b as any).is_pinned ? 1 : 0;
        if (bPinned !== aPinned) return bPinned - aPinned;

        const aTime = new Date(a.last_message?.created_at || a.updated_at).getTime();
        const bTime = new Date(b.last_message?.created_at || b.updated_at).getTime();
        return bTime - aTime;
      });
  }, [chats, search, filter]);

  // Discoverable users from PostgreSQL database
  const discoverableUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cleanQ = q.startsWith('@') ? q.slice(1) : q;

    return allUsers.filter((u) => {
      if (u.id === currentUser.id) return false;
      if (!cleanQ) {
        return filter === 'users';
      }
      return (
        (u.username || '').toLowerCase().includes(cleanQ) ||
        (u.full_name || '').toLowerCase().includes(cleanQ) ||
        (u.email || '').toLowerCase().includes(cleanQ)
      );
    });
  }, [allUsers, search, filter, currentUser.id]);

  const handleUserClick = (userId: string) => {
    if (onStartDirectChat) {
      onStartDirectChat(userId);
    } else {
      onOpenNewChat();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 touch-pan-y">
      {/* Top Application Bar */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar
            name={currentUser.full_name}
            src={currentUser.avatar_url}
            size="md"
            onClick={onOpenSettings}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {currentUser.full_name}
            </h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              @{currentUser.username}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          {/* Post Status Button */}
          {onOpenCreateStatus && (
            <button
              type="button"
              onClick={onOpenCreateStatus}
              className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors mr-1"
              title="Post 24-hour Status Story"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Status</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenStatus}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
            title="Stories / Status View"
          >
            <Radio className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenNewGroup}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
            title="New Group Chat"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
            title="New Direct Chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search chats or @username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap ${
              filter === 'unread'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            onClick={() => setFilter('groups')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap ${
              filter === 'groups'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Groups
          </button>
          <button
            type="button"
            onClick={() => setFilter('users')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors whitespace-nowrap flex items-center gap-1 ${
              filter === 'users'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            Users / People ({allUsers.length})
          </button>
        </div>
      </div>

      {/* Main List Scroll Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-slate-100 dark:divide-slate-800/40">
        {/* VIEW 1: USERS DIRECTORY TAB */}
        {filter === 'users' ? (
          <div className="p-2 space-y-1">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Registered Users ({discoverableUsers.length})
            </div>
            {discoverableUsers.map((user) => {
              const isUserOnline = onlineUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={user.full_name}
                      src={user.avatar_url}
                      size="md"
                      isOnline={isUserOnline}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                        <span>{user.full_name}</span>
                        {isUserOnline && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                            Online
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                        @{user.username}
                      </div>
                      {user.status_text && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {user.status_text}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 ml-2"
                  >
                    Message
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* VIEW 2: CHATS & USER SEARCH COMBINED */
          <>
            {/* Active conversations */}
            {filteredChats.map((chat) => {
              const otherMember = !chat.is_group
                ? chat.members?.find((m) => m.user_id !== currentUser.id)
                : null;
              const isChatOnline = otherMember ? onlineUserIds.includes(otherMember.user_id) : false;

              return (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChatId === chat.id}
                  isTyping={typingChatIds.includes(chat.id)}
                  isOnline={isChatOnline}
                  onClick={() => onSelectChat(chat.id)}
                />
              );
            })}

            {/* If searching: Show Discoverable Users matching the username */}
            {search.trim().length > 0 && discoverableUsers.length > 0 && (
              <div className="p-2 border-t border-slate-200 dark:border-slate-800">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Users matching &ldquo;{search}&rdquo;</span>
                  <span className="text-[9px] text-emerald-600 font-semibold">@username search</span>
                </div>
                {discoverableUsers.map((user) => {
                  const isUserOnline = onlineUserIds.includes(user.id);
                  return (
                    <div
                      key={`search-u-${user.id}`}
                      onClick={() => handleUserClick(user.id)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={user.full_name}
                          src={user.avatar_url}
                          size="sm"
                          isOnline={isUserOnline}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                            <span>{user.full_name}</span>
                            {isUserOnline && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Online" />
                            )}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}

            {filteredChats.length === 0 && discoverableUsers.length === 0 && search.trim().length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 space-y-3">
                <p>No active conversations yet.</p>
                <button
                  type="button"
                  onClick={onOpenNewChat}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-medium text-xs shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            )}

            {filteredChats.length === 0 && discoverableUsers.length === 0 && search.trim().length > 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No chats or users matching &ldquo;{search}&rdquo;
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
