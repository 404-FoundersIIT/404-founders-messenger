'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export default function AuthMainPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In State (Accepts User ID / Username or Email)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [unverifiedEmail, setUnverifiedEmail] = useState(false);

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Shared State
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if session exists (without forcing redirect away from auth page)
  const [existingUser, setExistingUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const saved = localStorage.getItem('demo_active_user');
        if (saved) {
          setExistingUser(JSON.parse(saved));
          return;
        }
        const profile = await authService.getCurrentProfile();
        if (profile) {
          setExistingUser(profile);
        }
      } catch {}
    }
    checkAuth();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail(false);
    setLoading(true);

    try {
      await authService.login({
        identifier: loginIdentifier,
        password: loginPassword,
        turnstileToken,
      });
      router.push('/chat');
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setUnverifiedEmail(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await authService.signup({
        fullName,
        username,
        email: signupEmail,
        password: signupPassword,
        turnstileToken,
      });
      setSignupSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-radial from-emerald-950/10 via-slate-50 to-slate-100 dark:from-emerald-950/20 dark:via-slate-950 dark:to-[#070d12] text-slate-900 dark:text-slate-100 select-none">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 animate-fade-in relative overflow-hidden my-auto">
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
            404 Founders
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>End-to-End Real-Time Messaging & Calling</span>
          </p>
        </div>

        {/* Active Session Notice (If already logged in) */}
        {existingUser && (
          <div className="mb-5 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 truncate">
                Active Session: <strong className="font-semibold text-emerald-600 dark:text-emerald-400">{existingUser.full_name || existingUser.username}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push('/chat')}
              className="shrink-0 ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1"
            >
              <span>Go to Chat</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-5 border border-slate-200/50 dark:border-slate-750">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          Continue with Google
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
          <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">or sign in with user id</span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* 1. SIGN IN TAB */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                User ID / Username or Email
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Username (e.g. aarav_sharma) or email"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                Remember session
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-[11px]"
              >
                Forgot password?
              </Link>
            </div>

            <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

            {unverifiedEmail && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span>Please verify your email address before signing in.</span>
                  <button
                    type="button"
                    onClick={() => authService.resendVerificationEmail(loginIdentifier)}
                    className="block mt-1 font-semibold text-emerald-600 underline"
                  >
                    Resend verification email
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 font-semibold shadow-md py-2.5"
              isLoading={loading}
            >
              Sign In to Messenger
            </Button>
          </form>
        )}

        {/* 2. SIGN UP TAB */}
        {activeTab === 'signup' && (
          signupSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Verification Link Sent
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                We sent a confirmation link to <span className="font-semibold text-emerald-600">{signupEmail}</span>.
                Please check your inbox to verify your account.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => authService.resendVerificationEmail(signupEmail)}
                className="w-full"
              >
                Resend Email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <Input
                label="Full Name"
                placeholder="e.g. Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Username (Unique ID)"
                placeholder="e.g. aarav_sharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<AtSign className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="aarav@college.edu"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />

              <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full mt-2 font-semibold shadow-md py-2.5" isLoading={loading}>
                Create Free Account
              </Button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
