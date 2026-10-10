'use client';

import React, { useState, useEffect } from 'react';
import { StatusStory } from '@/types/database';
import { Avatar } from '@/components/ui/Avatar';
import { formatChatTimestamp } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, Eye, PlusCircle, Send } from 'lucide-react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: StatusStory[];
  currentUserId: string;
  onViewStatus?: (statusId: string) => void;
  onOpenCreateStatus?: () => void;
  onReplyToStatus?: (targetUserId: string, replyText: string) => void;
}

export function StatusModal({
  isOpen,
  onClose,
  statuses,
  currentUserId,
  onViewStatus,
  onOpenCreateStatus,
  onReplyToStatus,
}: StatusModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isTypingReply, setIsTypingReply] = useState(false);
  const [replySentToast, setReplySentToast] = useState(false);

  const activeStatus = statuses[currentIndex];

  useEffect(() => {
    if (!isOpen || !activeStatus || isTypingReply) return;

    if (onViewStatus) {
      onViewStatus(activeStatus.id);
    }

    setProgress(0);
    const duration = 5000; // 5 seconds per story
    const step = 50;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            clearInterval(interval);
            onClose();
            return 100;
          }
        }
        return prev + (step / duration) * 100;
      });
    }, step);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, activeStatus, statuses.length, onClose, onViewStatus, isTypingReply]);

  if (!isOpen) return null;

  // Empty State Modal when no stories exist yet
  if (!activeStatus || statuses.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <PlusCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No Status Updates Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Be the first to share a text or photo status update with your contacts! Stories disappear after 24 hours.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            {onOpenCreateStatus && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateStatus();
                }}
                className="flex-1 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
              >
                + Post Status
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-white select-none animate-fade-in">
      <div className="relative w-full max-w-md h-full max-h-[85vh] flex flex-col justify-between p-4">
        {/* Progress Bars Header */}
        <div className="space-y-3 z-10">
          <div className="flex items-center gap-1">
            {statuses.map((s, idx) => (
              <div key={s.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < currentIndex
                        ? '100%'
                        : idx === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Info & Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={activeStatus.profile?.full_name || 'User'}
                src={activeStatus.profile?.avatar_url}
                size="sm"
              />
              <div>
                <h4 className="text-xs font-semibold">{activeStatus.profile?.full_name}</h4>
                <p className="text-[10px] text-white/70">
                  {formatChatTimestamp(activeStatus.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenCreateStatus && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreateStatus();
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Status</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center my-4 overflow-hidden relative">
          {activeStatus.status_type === 'text' ? (
            <div
              className="w-full h-full rounded-2xl flex items-center justify-center p-6 text-center shadow-lg"
              style={{ backgroundColor: activeStatus.background_color || '#075e54' }}
            >
              <p className="text-xl sm:text-2xl font-medium leading-relaxed font-sans">
                {activeStatus.content}
              </p>
            </div>
          ) : activeStatus.status_type === 'image' ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <img
                src={activeStatus.media_url!}
                alt="status"
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
              />
              {activeStatus.caption && (
                <p className="text-xs text-white/90 mt-2 px-3 py-1 bg-black/40 rounded-full">
                  {activeStatus.caption}
                </p>
              )}
            </div>
          ) : null}

          {/* Nav tap areas */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0 cursor-default"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0 cursor-default"
          />

          {/* Visible Chevron Indicators */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentIndex < statuses.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Footer: Views for owner, or Reaction / Reply Bar for viewer */}
        {activeStatus.user_id === currentUserId ? (
          <div className="flex items-center justify-center gap-1.5 py-1 text-xs text-white/70">
            <Eye className="w-3.5 h-3.5" />
            <span>{activeStatus.views?.length || 0} views</span>
          </div>
        ) : (
          <div className="space-y-2 pt-1 pb-1">
            {/* Quick Emoji Reactions */}
            <div className="flex items-center justify-center gap-2">
              {['❤️', '😂', '🔥', '👏', '😮', '😢'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    if (onReplyToStatus) {
                      onReplyToStatus(activeStatus.user_id, emoji);
                      setReplySentToast(true);
                      setTimeout(() => setReplySentToast(false), 2000);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-base flex items-center justify-center transition-transform hover:scale-125 active:scale-95 shadow-sm"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Direct Reply Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!replyText.trim()) return;
                if (onReplyToStatus) {
                  onReplyToStatus(
                    activeStatus.user_id,
                    `Replied to status: "${activeStatus.content || activeStatus.caption || 'Photo'}"\n${replyText.trim()}`
                  );
                  setReplyText('');
                  setIsTypingReply(false);
                  setReplySentToast(true);
                  setTimeout(() => setReplySentToast(false), 2000);
                }
              }}
              className="flex items-center gap-2 px-2"
            >
              <input
                type="text"
                placeholder="Reply to status..."
                value={replyText}
                onFocus={() => setIsTypingReply(true)}
                onBlur={() => !replyText && setIsTypingReply(false)}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white placeholder:text-white/60 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors shadow-sm"
                title="Send reply"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {replySentToast && (
              <div className="text-center text-[11px] text-emerald-400 font-medium animate-fade-in">
                Reply sent to contact!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
