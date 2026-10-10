'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  className?: string;
}

export function TurnstileWidget({ onVerify, onError, className = '' }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  useEffect(() => {
    // If running in development with dummy sitekey or without online Turnstile script
    if (siteKey === '1x00000000000000000000AA') {
      const timer = setTimeout(() => {
        onVerify('dummy-test-token');
      }, 500);
      return () => clearTimeout(timer);
    }

    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoaded';
    script.async = true;
    script.defer = true;

    window.onTurnstileLoaded = () => {
      setScriptLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey, onVerify]);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerify(token);
        },
        'expired-callback': () => {
          onVerify('');
        },
        'error-callback': () => {
          onVerify('');
        },
        theme: 'auto',
      });
    } catch (err) {
      console.warn('Turnstile render warning:', err);
      // Fallback in case of domain restriction in localhost
      onVerify('dummy-test-token');
    }
  }, [scriptLoaded, siteKey, onVerify]);

  return (
    <div className={`flex flex-col items-center justify-center my-2 min-h-[65px] ${className}`}>
      <div ref={containerRef} />
      {siteKey === '1x00000000000000000000AA' && (
        <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-emerald-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Cloudflare Turnstile Verified (Dev Mode)
        </span>
      )}
    </div>
  );
}
