'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Mail,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Initialize from search params or local storage
  useEffect(() => {
    const paramEmail = searchParams.get('email');
    const paramOtp = searchParams.get('otp');
    const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('pending_verify_email') : null;

    const initialEmail = paramEmail || savedEmail || '';
    if (initialEmail) {
      setEmail(initialEmail);
    }

    if (paramOtp) {
      setOtp(paramOtp);
      // Auto verify if both email and otp are present in URL (e.g., from 1-click email button)
      if (initialEmail) {
        autoVerify(initialEmail, paramOtp);
      }
    }
  }, [searchParams]);

  const autoVerify = async (userEmail: string, code: string) => {
    setLoading(true);
    setError('');
    try {
      await authService.verifyOtp(userEmail.trim(), code.trim());
      setVerifiedSuccess(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_verify_email');
      }
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setResendStatus('');

    try {
      await authService.verifyOtp(email.trim(), otp.trim());
      setVerifiedSuccess(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_verify_email');
      }
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code. Please check your email or request a new code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email to resend the code.');
      return;
    }

    setResending(true);
    setError('');
    setResendStatus('Sending a fresh code to your inbox...');

    try {
      await authService.resendVerificationEmail(email.trim());
      setResendStatus('A fresh 6-digit code has been delivered to your Gmail inbox.');
      setTimeout(() => setResendStatus(''), 5000);
    } catch (err: any) {
      setResendStatus('');
      setError(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (verifiedSuccess) {
    return (
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          Email Verified Successfully!
        </h2>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-6">
          Your account is now activated. Entering 404 Founders Messenger...
        </p>
        <Link href="/chat">
          <Button variant="primary" className="w-full">
            Open Messenger Now <ArrowRight className="w-4 h-4 ml-1 inline" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 animate-fade-in relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-3xl border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-600 shadow-sm">
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Enter Verification Code
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Enter the 6-digit code sent to your Gmail</span>
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resend success status */}
      {resendStatus && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{resendStatus}</span>
        </div>
      )}

      {/* Verification Form */}
      <form onSubmit={handleVerify} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Account Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              required
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 6-Digit OTP Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="• • • • • •"
            autoFocus
            required
            className="w-full py-3 text-center tracking-[0.5em] text-2xl font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border-2 border-emerald-500/40 focus:border-emerald-500 rounded-xl text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 placeholder:text-base"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 text-center">
            Check your Gmail spam/inbox for the 6-digit code
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="w-full font-semibold py-2.5 text-sm"
        >
          Verify & Activate Account
        </Button>
      </form>

      {/* Resend Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email}
          className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resending ? 'Resending...' : 'Resend Code'}</span>
        </button>

        <Link
          href="/auth/login"
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Back to Login &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-8 sm:py-12 bg-radial from-emerald-950/10 via-slate-50 to-slate-100 dark:from-emerald-950/20 dark:via-slate-950 dark:to-[#070d12] text-slate-900 dark:text-slate-100">
      <Suspense
        fallback={
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        }
      >
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
