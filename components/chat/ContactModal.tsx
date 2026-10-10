'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { DEMO_USERS } from '@/lib/demoData';
import { Profile } from '@/types/database';
import { Search } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareContact: (contact: { contactUserId: string; contactName: string; contactPhone?: string }) => void;
}

export function ContactModal({ isOpen, onClose, onShareContact }: ContactModalProps) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const filteredUsers = DEMO_USERS.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedUser) {
      onShareContact({
        contactUserId: selectedUser.id,
        contactName: selectedUser.full_name,
        contactPhone: `@${selectedUser.username}`,
      });
      setSelectedUser(null);
      setSearch('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Contact" maxWidth="md">
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredUsers.map((user) => {
            const isSelected = selectedUser?.id === user.id;
            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/50'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">@{user.username}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!selectedUser}
            onClick={handleConfirm}
          >
            Share Contact
          </Button>
        </div>
      </div>
    </Modal>
  );
}
