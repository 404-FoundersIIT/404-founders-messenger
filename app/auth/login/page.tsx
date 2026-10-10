'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import {
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({
        identifier,
        password,
        turnstileToken,
      });
      window.location.href = '/chat';
    } catch (err: any) {
      setError(err?.message || 'Invalid User ID or Password. Please check credentials or sign up.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize Google authentication');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-8 sm:py-12 bg-radial from-emerald-950/10 via-slate-50 to-slate-100 dark:from-emerald-950/20 dark:via-slate-950 dark:to-[#070d12] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 animate-fade-in relative my-auto">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branding Header */}
        <div className="text-center mb-6 relative">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 dark:from-emerald-900/40 dark:to-teal-900/30 rounded-3xl border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-sm group">
            <img
              src="/logo.png"
              alt="404 Founders"
              className="w-10 h-10 object-contain drop-shadow transition-transform group-hover:scale-105"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome Back
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sign in to 404 Founders Messenger</span>
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-xs disabled:opacity-50 mb-5"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            or sign in with credentials
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="User ID / Username or Email"
            type="text"
            placeholder="aarav_sharma or aarav@404founders.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
            autoComplete="username"
          />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Remember me</span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Cloudflare Turnstile */}
          <div className="pt-1">
            <TurnstileWidget
              onVerify={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken('mock_pass')}
            />
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 space-y-2">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-emerald-600 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
