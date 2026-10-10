'use client';

import React from 'react';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

const badgeSizes = {
  xs: 'w-1.5 h-1.5 bottom-0 right-0 border',
  sm: 'w-2.5 h-2.5 bottom-0 right-0 border',
  md: 'w-3 h-3 bottom-0 right-0 border-2',
  lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
  xl: 'w-4 h-4 bottom-1 right-1 border-2',
  '2xl': 'w-5 h-5 bottom-1 right-1 border-2',
};

export function Avatar({
  src,
  name,
  size = 'md',
  isOnline,
  className,
  onClick,
}: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-full select-none overflow-visible',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-semibold tracking-wide"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-white dark:border-slate-900 transition-colors',
            isOnline
              ? 'bg-emerald-500 shadow-sm ring-1 ring-emerald-400/60'
              : 'bg-slate-300 dark:bg-slate-600',
            badgeSizes[size]
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
