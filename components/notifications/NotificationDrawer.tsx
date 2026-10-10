'use client';

import React from 'react';
import { NotificationItem } from '@/types/database';
import { formatChatTimestamp } from '@/lib/utils';
import {
  X,
  Bell,
  CheckCheck,
  MessageSquare,
  UserPlus,
  PhoneMissed,
  ShieldAlert,
  AtSign,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectNotification,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'missed_call':
        return <PhoneMissed className="w-4 h-4 text-red-500" />;
      case 'group_added':
      case 'group_invite':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-blue-500" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in select-none">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-slide-left border-l border-slate-200 dark:border-slate-800">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onMarkAllRead}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 text-xs flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs scrollbar-thin">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.is_read) onMarkRead(item.id);
                  if (onSelectNotification) onSelectNotification(item);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  item.is_read
                    ? 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80 text-slate-500'
                    : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 font-medium text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {formatChatTimestamp(item.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center">
              <Bell className="w-8 h-8 stroke-1 mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
