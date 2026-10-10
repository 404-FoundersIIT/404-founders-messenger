'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { userService } from '@/services/userService';
import { Profile } from '@/types/database';
import { Search } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onStartChat: (targetUserId: string) => void;
}

export function NewChatModal({
  isOpen,
  onClose,
  currentUserId,
  onStartChat,
}: NewChatModalProps) {
  const [search, setSearch] = useState('');
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);

  useEffect(() => {
    if (isOpen) {
      userService.getAllProfiles().then((users) => {
        setAvailableUsers(users.filter((u) => u.id !== currentUserId));
      });
    }
  }, [isOpen, currentUserId]);

  const filteredUsers = availableUsers.filter((u) => {
    const q = search.trim().toLowerCase();
    const cleanQ = q.startsWith('@') ? q.slice(1) : q;

    if (!cleanQ) return true;
    return (
      (u.full_name || '').toLowerCase().includes(cleanQ) ||
      (u.username || '').toLowerCase().includes(cleanQ) ||
      (u.email || '').toLowerCase().includes(cleanQ)
    );
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Direct Chat" maxWidth="sm">
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No users found</p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  onStartChat(user.id);
                  onClose();
                }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <Avatar name={user.full_name} src={user.avatar_url} size="md" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user.full_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    @{user.username} &bull; {user.status_text || 'Available'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
