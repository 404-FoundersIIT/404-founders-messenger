'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 focus:ring-slate-400',
    outline:
      'border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-slate-400',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus:ring-slate-400',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-base rounded-lg gap-2.5',
    icon: 'p-2 rounded-lg',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
