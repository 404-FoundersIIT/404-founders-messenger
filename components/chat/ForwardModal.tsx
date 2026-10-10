'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Message, Chat } from '@/types/database';
import { Search, Forward } from 'lucide-react';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  chats: Chat[];
  onForward: (targetChatId: string, message: Message) => void;
}

export function ForwardModal({ isOpen, onClose, message, chats, onForward }: ForwardModalProps) {
  const [search, setSearch] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  if (!message) return null;

  const filteredChats = chats.filter((c) =>
    (c.name || 'Chat').toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedChatId && message) {
      onForward(selectedChatId, message);
      setSelectedChatId(null);
      setSearch('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forward Message" maxWidth="md">
      <div className="space-y-3">
        {/* Preview of message being forwarded */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border-l-4 border-emerald-500 text-xs text-slate-700 dark:text-slate-300">
          <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">
            {message.sender?.full_name || 'Message'}
          </div>
          <div className="truncate">{message.text || `[${message.message_type}]`}</div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search chats to forward to..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {filteredChats.map((chat) => {
            const isSelected = selectedChatId === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/50'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Avatar name={chat.name || 'Chat'} src={chat.photo_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {chat.name || 'Chat'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {chat.is_group ? 'Group chat' : 'Direct conversation'}
                  </div>
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
            disabled={!selectedChatId}
            onClick={handleConfirm}
          >
            <Forward className="w-4 h-4 mr-1.5" /> Forward
          </Button>
        </div>
      </div>
    </Modal>
  );
}
