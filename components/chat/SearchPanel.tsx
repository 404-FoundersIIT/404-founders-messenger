'use client';

import React, { useState, useEffect } from 'react';
import { Message } from '@/types/database';
import { messageService } from '@/services/messageService';
import { formatChatTimestamp } from '@/lib/utils';
import { Search, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react';

interface SearchPanelProps {
  chatId: string;
  onClose: () => void;
  onSelectMessage: (messageId: string) => void;
}

export function SearchPanel({ chatId, onClose, onSelectMessage }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const msgs = await messageService.searchMessages(q, chatId);
        setResults(msgs);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, chatId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const msgs = await messageService.searchMessages(query, chatId);
      setResults(msgs);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col select-none overflow-hidden animate-slide-left z-20">
      <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Search Messages
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSearch} className="p-3 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Type and press Enter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            autoFocus
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching...
          </div>
        ) : results.length > 0 ? (
          results.map((msg) => (
            <div
              key={msg.id}
              onClick={() => onSelectMessage(msg.id)}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {msg.sender?.full_name || 'User'}
                </span>
                <span>{formatChatTimestamp(msg.created_at)}</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                {msg.text || `[${msg.message_type}]`}
              </p>
            </div>
          ))
        ) : query ? (
          <div className="p-8 text-center text-slate-400">No matching messages found</div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            Search for words, media, or documents
          </div>
        )}
      </div>
    </div>
  );
}
