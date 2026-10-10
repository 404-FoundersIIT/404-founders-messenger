'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Type, Image as ImageIcon } from 'lucide-react';

const STATUS_COLORS = [
  '#075e54', '#128c7e', '#00a884', '#0284c7', '#2563eb',
  '#7c3aed', '#db2777', '#dc2626', '#d97706', '#334155'
];

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostStatus: (data: {
    statusType: 'text' | 'image';
    content?: string;
    mediaFile?: File;
    backgroundColor?: string;
  }) => void;
}

export function CreateStatusModal({ isOpen, onClose, onPostStatus }: CreateStatusModalProps) {
  const [tab, setTab] = useState<'text' | 'media'>('text');
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState(STATUS_COLORS[0]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'text' && text.trim()) {
      onPostStatus({
        statusType: 'text',
        content: text.trim(),
        backgroundColor: selectedColor,
      });
      setText('');
      onClose();
    } else if (tab === 'media' && mediaFile) {
      onPostStatus({
        statusType: 'image',
        mediaFile,
      });
      setMediaFile(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Status" maxWidth="sm">
      <div className="space-y-4">
        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`flex-1 py-2 font-medium flex items-center justify-center gap-1.5 border-b-2 ${
              tab === 'text'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Text Status
          </button>
          <button
            type="button"
            onClick={() => setTab('media')}
            className={`flex-1 py-2 font-medium flex items-center justify-center gap-1.5 border-b-2 ${
              tab === 'media'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Photo / Video
          </button>
        </div>

        {tab === 'text' ? (
          <div className="space-y-3">
            <div
              className="w-full h-40 rounded-xl p-4 flex items-center justify-center transition-colors"
              style={{ backgroundColor: selectedColor }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a status..."
                className="w-full bg-transparent text-white text-center text-base placeholder:text-white/60 resize-none focus:outline-none"
                rows={3}
              />
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {STATUS_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={`w-6 h-6 rounded-full shrink-0 transition-transform ${
                    selectedColor === col ? 'scale-125 ring-2 ring-emerald-500 ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                if (e.target.files?.[0]) setMediaFile(e.target.files[0]);
              }}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {mediaFile && (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Selected: {mediaFile.name}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={tab === 'text' ? !text.trim() : !mediaFile}
          >
            Post Status
          </Button>
        </div>
      </div>
    </Modal>
  );
}
