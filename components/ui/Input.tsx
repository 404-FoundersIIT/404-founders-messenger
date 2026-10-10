'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    const activeIcon = icon || leftIcon;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {activeIcon && (
            <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
              {activeIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-lg transition-colors',
              'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
              'disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400',
              activeIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-700',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
