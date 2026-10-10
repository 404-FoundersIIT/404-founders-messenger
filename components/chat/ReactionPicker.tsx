'use client';

import React from 'react';

const COMMON_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🙏', '🔥', '👏'];

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  className?: string;
}

export function ReactionPicker({ onSelectEmoji, className = '' }: ReactionPickerProps) {
  return (
    <div
      className={`flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in ${className}`}
    >
      {COMMON_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectEmoji(emoji);
          }}
          className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
