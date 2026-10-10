'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.updateUser({
        password,
      });

      if (resetErr) throw resetErr;
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <img src="/logo.png" alt="404 Founders" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Set New Password</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose a secure password for your account
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Your password has been successfully updated.
            </p>
            <Link href="/auth/login" className="inline-block w-full">
              <Button variant="primary" className="w-full">
                Sign In with New Password
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
