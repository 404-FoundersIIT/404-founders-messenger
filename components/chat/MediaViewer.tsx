'use client';

import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  fileName?: string;
  caption?: string;
}

export function MediaViewer({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  fileName = 'file',
  caption,
}: MediaViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mediaUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 select-none animate-fade-in">
      {/* Top action bar */}
      <div className="flex items-center justify-between p-4 z-10">
        <span className="text-sm font-medium text-white/80 truncate max-w-xs">{fileName}</span>
        <div className="flex items-center gap-3">
          <a
            href={mediaUrl}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main media display */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={caption || fileName}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
          />
        )}
      </div>

      {/* Optional Caption */}
      {caption && (
        <div className="p-4 text-center text-sm text-white/90 bg-black/60 backdrop-blur-sm">
          {caption}
        </div>
      )}
    </div>
  );
}
