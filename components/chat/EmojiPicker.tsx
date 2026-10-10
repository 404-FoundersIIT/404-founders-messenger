'use client';

import React, { useState, useMemo } from 'react';
import { Search, Smile, Heart, Coffee, ThumbsUp, Sparkles } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎',
      '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
      '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
    ],
  },
  {
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘',
      '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
      '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🤝',
      '👏', '🙌', '👐', '🤲', '💅', '🤳', '👂', '👃', '👀', '👁️',
    ],
  },
  {
    name: 'Love & Hearts',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '💌', '💐', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '✨',
    ],
  },
  {
    name: 'Food & Drink',
    icon: Coffee,
    emojis: [
      '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🍷', '🥂', '🍾',
      '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜',
      '🍲', '🍣', '🍱', '🍛', '🍙', '🍚', '🍰', '🎂', '🧁', '🍦',
      '🍩', '🍪', '🍫', '🍿', '🍎', '🍓', '🥑', '🍉', '🍌', '🍇',
    ],
  },
  {
    name: 'Objects & Symbols',
    icon: Sparkles,
    emojis: [
      '🔥', '🚀', '🎉', '🎊', '🎈', '🏆', '🥇', '💻', '📱', '💡',
      '📚', '🎓', '💯', '✅', '❌', '⚠️', '⚡', '⭐', '🌟', '🎯',
      '🔔', '📌', '📎', '🔑', '🔒', '📦', '🎁', '🎵', '🎶', '📷',
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onSelect, className = '' }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return all;
  }, [search]);

  return (
    <div
      className={`w-72 sm:w-80 h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden select-none z-50 ${className}`}
    >
      {/* Search Header */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex items-center justify-around px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {EMOJI_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`p-1.5 rounded-lg transition-colors ${
                  activeTab === idx
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {search ? (
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-1 px-1">Search Results</div>
            <div className="grid grid-cols-7 gap-1">
              {(filteredEmojis || []).map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  type="button"
                  onClick={() => onSelect(emoji)}
                  className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-1 px-1">
              {EMOJI_CATEGORIES[activeTab].name}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelect(emoji)}
                  className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
