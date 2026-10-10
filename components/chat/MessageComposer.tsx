'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/database';
import { EmojiPicker } from './EmojiPicker';
import { StickerPicker } from './StickerPicker';
import { VoiceRecorder } from './VoiceRecorder';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  X,
  Image as ImageIcon,
  FileText,
  BarChart2,
  MapPin,
  User as UserIcon,
  Sticker as StickerIcon,
} from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (text: string, replyToId?: string | null) => void;
  onSendMedia: (file: File, category: 'image' | 'video' | 'document') => void;
  onSendVoice: (blob: Blob, duration: number) => void;
  onSendSticker: (stickerUrl: string) => void;
  onOpenPollModal: () => void;
  onOpenLocationModal: () => void;
  onOpenContactModal: () => void;
  onTyping: (isTyping: boolean) => void;
  replyingToMessage: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export function MessageComposer({
  onSendMessage,
  onSendMedia,
  onSendVoice,
  onSendSticker,
  onOpenPollModal,
  onOpenLocationModal,
  onOpenContactModal,
  onTyping,
  replyingToMessage,
  onCancelReply,
  disabled = false,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Typing indicator throttle
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim(), replyingToMessage?.id || null);
    setText('');
    onCancelReply();
    setShowEmojiPicker(false);
    setShowStickerPicker(false);
    onTyping(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, category: 'image' | 'video' | 'document') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onSendMedia(file, category);
      e.target.value = '';
      setShowAttachMenu(false);
    }
  };

  if (isRecordingVoice) {
    return (
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <VoiceRecorder
          onSendVoice={(blob, duration) => {
            onSendVoice(blob, duration);
            setIsRecordingVoice(false);
          }}
          onCancel={() => setIsRecordingVoice(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 sm:p-3">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const cat = file.type.startsWith('video/') ? 'video' : 'image';
            handleFileSelect(e, cat);
          }
        }}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'document')}
      />

      {/* Reply Quote Banner */}
      {replyingToMessage && (
        <div className="mb-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-l-4 border-emerald-500 flex items-center justify-between text-xs animate-fade-in">
          <div className="truncate pr-2">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
              Replying to {replyingToMessage.sender?.full_name || 'Message'}
            </span>
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {replyingToMessage.text || `[${replyingToMessage.message_type}]`}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Popups: Emoji & Sticker Pickers */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 z-40">
          <EmojiPicker
            onSelect={(emoji) => {
              setText((prev) => prev + emoji);
            }}
          />
        </div>
      )}

      {showStickerPicker && (
        <div className="absolute bottom-16 left-3 z-40">
          <StickerPicker
            onSelectSticker={(url) => {
              onSendSticker(url);
              setShowStickerPicker(false);
            }}
          />
        </div>
      )}

      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 w-48 space-y-1 animate-fade-in text-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" /> Photos & Videos
          </button>
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <FileText className="w-4 h-4 text-blue-500" /> Document
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              onOpenPollModal();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <BarChart2 className="w-4 h-4 text-amber-500" /> Poll
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              onOpenLocationModal();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <MapPin className="w-4 h-4 text-rose-500" /> Location
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              onOpenContactModal();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <UserIcon className="w-4 h-4 text-purple-500" /> Contact
          </button>
        </div>
      )}

      {/* Main Composer Input Bar */}
      <div className="flex items-end gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 pb-1 text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowStickerPicker(false);
              setShowAttachMenu(false);
            }}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              showEmojiPicker ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : ''
            }`}
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowStickerPicker(!showStickerPicker);
              setShowEmojiPicker(false);
              setShowAttachMenu(false);
            }}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              showStickerPicker ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : ''
            }`}
            title="Stickers"
          >
            <StickerIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiPicker(false);
              setShowStickerPicker(false);
            }}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              showAttachMenu ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : ''
            }`}
            title="Attach"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        {/* Text Input Area */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3.5 py-2 focus-within:ring-2 focus-within:ring-emerald-500/50">
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Only admins can send messages' : 'Type a message...'}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent resize-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none max-h-32 leading-relaxed"
          />
        </div>

        {/* Send / Voice Note Button */}
        <div className="pb-1">
          {text.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-95 shadow-sm"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-95 shadow-sm"
              title="Record voice note"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
