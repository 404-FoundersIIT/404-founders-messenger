'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import {
  Mail,
  Lock,
  User,
  AtSign,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Registration state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
      await authService.signup({
        fullName,
        username,
        email,
        password,
        turnstileToken,
      });

      setIsSuccess(true);
      // Instant transition directly to /chat - No OTP required!
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize Google authentication');
      setGoogleLoading(false);
    }
  };

  // SUCCESS SCREEN: 1-Click Instant Success Card
  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-8 sm:py-12 bg-radial from-emerald-950/10 via-slate-50 to-slate-100 dark:from-emerald-950/20 dark:via-slate-950 dark:to-[#070d12] text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-8 text-center animate-fade-in my-auto">
          <div className="space-y-4 py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Account Created Successfully!
            </h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Welcome, <span className="font-bold">{fullName}</span>! Opening your messenger...
            </p>
            <div className="pt-3">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full flex items-center justify-center gap-1.5"
                onClick={() => {
                  window.location.href = '/chat';
                }}
              >
                <span>Enter Messenger Now</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REGISTRATION FORM SCREEN (Clean touch and scroll enabled)
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
            Create an Account
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Instant Access &bull; No OTP Verification Required</span>
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all text-xs font-semibold shadow-xs mb-4"
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
          <span>{googleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            or register with email
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            type="text"
            placeholder="Aarav Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
            autoComplete="name"
          />

          <Input
            label="Username (unique handle)"
            type="text"
            placeholder="aarav_sharma"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            leftIcon={<AtSign className="w-4 h-4 text-slate-400" />}
            required
            autoComplete="username"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="aarav@404founders.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
            autoComplete="email"
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

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
              />
            </div>
          </div>

          {/* Cloudflare Turnstile */}
          <div className="pt-1">
            <TurnstileWidget
              onVerify={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken('mock_pass')}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="w-full mt-2 flex items-center justify-center gap-1.5"
          >
            <span>Create Account & Start Messaging</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
