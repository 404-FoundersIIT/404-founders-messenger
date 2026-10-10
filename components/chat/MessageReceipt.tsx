'use client';

import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

interface MessageReceiptProps {
  isOutgoing: boolean;
  isDelivered?: boolean;
  isRead?: boolean;
  isPending?: boolean;
  className?: string;
}

export function MessageReceipt({
  isOutgoing,
  isDelivered = true,
  isRead = false,
  isPending = false,
  className = '',
}: MessageReceiptProps) {
  if (!isOutgoing) return null;

  if (isPending) {
    return (
      <span
        title="Saved in cache memory — will send automatically when internet connects"
        className={`inline-flex items-center text-slate-400 dark:text-slate-400 ${className}`}
      >
        <Clock className="w-3 h-3 animate-pulse" />
      </span>
    );
  }

  if (isRead) {
    return (
      <span title="Read" className={`inline-flex items-center text-sky-500 ${className}`}>
        <CheckCheck className="w-4 h-4 stroke-[2.2]" />
      </span>
    );
  }

  if (isDelivered) {
    return (
      <span title="Delivered" className={`inline-flex items-center text-slate-400 dark:text-slate-400 ${className}`}>
        <CheckCheck className="w-4 h-4 stroke-[2]" />
      </span>
    );
  }

  return (
    <span title="Sent" className={`inline-flex items-center text-slate-400 dark:text-slate-400 ${className}`}>
      <Check className="w-3.5 h-3.5 stroke-[2]" />
    </span>
  );
}
