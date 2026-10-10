'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email, turnstileToken);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to request password reset link.');
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reset Password</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              If an account exists for <span className="font-semibold text-emerald-600">{email}</span>,
              a password reset email has been dispatched via SMTP.
            </p>
            <Link href="/auth/login" className="inline-block text-xs font-semibold text-emerald-600 hover:underline">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Email"
              type="email"
              placeholder="aarav@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
