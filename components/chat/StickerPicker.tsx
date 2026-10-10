import React, { useState } from 'react';
import { DEMO_STICKER_PACKS } from '@/lib/demoData';
import { StickerPack } from '@/types/database';
import { Upload, Plus, Link as LinkIcon } from 'lucide-react';

interface StickerPickerProps {
  onSelectSticker: (imageUrl: string, emojiTag?: string) => void;
  className?: string;
}

const ADDITIONAL_PACKS: StickerPack[] = [
  {
    id: 'pack_memes',
    name: 'Meme Reactions',
    description: 'Popular reaction stickers',
    author: 'Internet Culture',
    icon_url: 'https://cdn-icons-png.flaticon.com/128/742/742751.png',
    is_official: true,
    created_at: new Date().toISOString(),
    stickers: [
      { id: 'm1', pack_id: 'pack_memes', image_url: 'https://cdn-icons-png.flaticon.com/128/742/742751.png', emoji_tag: '😂', created_at: new Date().toISOString() },
      { id: 'm2', pack_id: 'pack_memes', image_url: 'https://cdn-icons-png.flaticon.com/128/742/742752.png', emoji_tag: '😎', created_at: new Date().toISOString() },
      { id: 'm3', pack_id: 'pack_memes', image_url: 'https://cdn-icons-png.flaticon.com/128/742/742760.png', emoji_tag: '🤩', created_at: new Date().toISOString() },
      { id: 'm4', pack_id: 'pack_memes', image_url: 'https://cdn-icons-png.flaticon.com/128/742/742765.png', emoji_tag: '🔥', created_at: new Date().toISOString() },
      { id: 'm5', pack_id: 'pack_memes', image_url: 'https://cdn-icons-png.flaticon.com/128/742/742774.png', emoji_tag: '🥳', created_at: new Date().toISOString() },
      { id: 'm6', pack_id: 'pack_memes', image_url: 'https://cdn-icons-png.flaticon.com/128/742/742784.png', emoji_tag: '😱', created_at: new Date().toISOString() },
      { id: 'm7', pack_id: 'pack_memes', image_url: 'https://cdn-icons-png.flaticon.com/128/742/742790.png', emoji_tag: '❤️', created_at: new Date().toISOString() },
      { id: 'm8', pack_id: 'pack_memes', image_url: 'https://cdn-icons-png.flaticon.com/128/742/742813.png', emoji_tag: '👍', created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'pack_cute',
    name: 'Cute Animals',
    description: 'Wholesome cute animal stickers',
    author: 'Sticker Studio',
    icon_url: 'https://cdn-icons-png.flaticon.com/128/616/616408.png',
    is_official: true,
    created_at: new Date().toISOString(),
    stickers: [
      { id: 'c1', pack_id: 'pack_cute', image_url: 'https://cdn-icons-png.flaticon.com/128/616/616408.png', emoji_tag: '🐱', created_at: new Date().toISOString() },
      { id: 'c2', pack_id: 'pack_cute', image_url: 'https://cdn-icons-png.flaticon.com/128/616/616430.png', emoji_tag: '🐶', created_at: new Date().toISOString() },
      { id: 'c3', pack_id: 'pack_cute', image_url: 'https://cdn-icons-png.flaticon.com/128/616/616490.png', emoji_tag: '🐼', created_at: new Date().toISOString() },
      { id: 'c4', pack_id: 'pack_cute', image_url: 'https://cdn-icons-png.flaticon.com/128/616/616412.png', emoji_tag: '🦊', created_at: new Date().toISOString() },
      { id: 'c5', pack_id: 'pack_cute', image_url: 'https://cdn-icons-png.flaticon.com/128/616/616429.png', emoji_tag: '🐰', created_at: new Date().toISOString() },
      { id: 'c6', pack_id: 'pack_cute', image_url: 'https://cdn-icons-png.flaticon.com/128/616/616481.png', emoji_tag: '🐻', created_at: new Date().toISOString() },
      { id: 'c7', pack_id: 'pack_cute', image_url: 'https://cdn-icons-png.flaticon.com/128/616/616460.png', emoji_tag: '🦁', created_at: new Date().toISOString() },
      { id: 'c8', pack_id: 'pack_cute', image_url: 'https://cdn-icons-png.flaticon.com/128/616/616447.png', emoji_tag: '🐨', created_at: new Date().toISOString() },
    ],
  },
];

export function StickerPicker({ onSelectSticker, className = '' }: StickerPickerProps) {
  const [packs] = useState<StickerPack[]>([...DEMO_STICKER_PACKS, ...ADDITIONAL_PACKS]);
  const [activePackIndex, setActivePackIndex] = useState(0);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const activePack = packs[activePackIndex];

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSelectSticker(event.target.result as string, 'custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onSelectSticker(customUrl.trim(), 'custom');
      setCustomUrl('');
      setShowUrlInput(false);
    }
  };

  return (
    <div
      className={`w-72 sm:w-80 h-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none z-50 ${className}`}
    >
      {/* Header with Pack Info and Custom Upload Button */}
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
            {activePack?.name || 'Sticker Packs'}
          </span>
          <span className="text-[10px] text-slate-400">
            {activePack?.author || '404 Founders'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] flex items-center gap-1"
            title="Paste external sticker URL"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <label className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] flex items-center gap-1 cursor-pointer font-semibold" title="Upload custom sticker">
            <Plus className="w-3.5 h-3.5" /> Add
            <input type="file" accept="image/*" onChange={handleCustomFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {showUrlInput && (
        <form onSubmit={handleCustomUrlSubmit} className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-1">
          <input
            type="url"
            placeholder="Paste image / sticker URL..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button type="submit" className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">
            Send
          </button>
        </form>
      )}

      {/* Stickers Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-3 scrollbar-thin">
        {activePack?.stickers?.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => onSelectSticker(sticker.image_url, sticker.emoji_tag)}
            className="w-14 h-14 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title={sticker.emoji_tag}
          >
            <img
              src={sticker.image_url}
              alt={sticker.emoji_tag || 'sticker'}
              className="w-12 h-12 object-contain pointer-events-none"
            />
          </button>
        ))}
      </div>

      {/* Footer Pack Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto">
        {packs.map((pack, idx) => (
          <button
            key={pack.id}
            type="button"
            onClick={() => setActivePackIndex(idx)}
            className={`w-8 h-8 rounded-xl p-1 flex items-center justify-center transition-all ${
              activePackIndex === idx
                ? 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500'
                : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title={pack.name}
          >
            <img
              src={pack.icon_url}
              alt={pack.name}
              className="w-5 h-5 object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
