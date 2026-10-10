'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Completing Google Sign-In...');

  useEffect(() => {
    const userParam = searchParams.get('user');
    if (userParam) {
      try {
        const user = JSON.parse(userParam);
        localStorage.setItem('demo_active_user', JSON.stringify(user));
        localStorage.setItem('404_active_user', JSON.stringify(user));
        setStatus('Welcome back, ' + (user.full_name || 'User') + '!');
        setTimeout(() => {
          window.location.href = '/chat';
        }, 800);
        return;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Fallback if no user param
    setTimeout(() => {
      window.location.href = '/chat';
    }, 1200);
  }, [searchParams, router]);

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-sm w-full space-y-4">
      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{status}</h2>
      <p className="text-xs text-slate-500">Redirecting to 404 Founders Messenger...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4">
      <Suspense
        fallback={
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-sm w-full space-y-4">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Authenticating with Google...</p>
          </div>
        }
      >
        <GoogleCallbackContent />
      </Suspense>
    </div>
  );
}
