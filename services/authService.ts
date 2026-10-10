import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { DEMO_USERS } from '@/lib/demoData';

export interface SignupParams {
  fullName: string;
  username: string;
  email: string;
  password: string;
  turnstileToken?: string;
}

export interface LoginParams {
  email?: string;
  identifier?: string;
  password: string;
  turnstileToken?: string;
}

export const ACTIVE_USER_KEY = '404_active_user';

export function getLocalActiveUser(): Profile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY) || localStorage.getItem('demo_active_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalActiveUser(user: Profile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    localStorage.setItem('demo_active_user', JSON.stringify(user));
  } catch {}
}

export const authService = {
  async getAllUsers(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Profile[];
      }
    } catch {}

    return DEMO_USERS;
  },

  async signup({ fullName, username, email, password, turnstileToken }: SignupParams) {
    // 1. Verify Turnstile token if present
    if (turnstileToken) {
      try {
        const res = await fetch('/api/auth/turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Turnstile verification failed. Please try again.');
        }
      } catch (e: any) {
        if (e?.message?.includes('Turnstile verification failed')) throw e;
      }
    }

    // 2. Call instant registration endpoint (verified immediately, no OTP)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, email, password }),
    });

    const data = await res.json();
    if (!data.success || !data.user) {
      throw new Error(data.error || 'Failed to create account. Please try again.');
    }

    setLocalActiveUser(data.user);
    return data;
  },

  async verifyOtp(email: string, otp: string): Promise<Profile> {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();
    if (!data.success || !data.user) {
      throw new Error(data.error || 'Invalid verification code. Please try again.');
    }

    setLocalActiveUser(data.user);
    return data.user;
  },

  async login({ email, identifier, password, turnstileToken }: LoginParams) {
    if (turnstileToken) {
      try {
        const res = await fetch('/api/auth/turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Turnstile challenge failed. Please try again.');
        }
      } catch (e: any) {
        if (e?.message?.includes('Turnstile challenge failed')) throw e;
      }
    }

    const idInput = (identifier || email || '').trim();

    // 1. Authenticate via server login endpoint
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: idInput, password }),
    });

    const data = await res.json();
    if (data.success && data.user) {
      setLocalActiveUser(data.user);
      return { user: data.user, session: {} };
    }

    // 2. Fallback check for demo users
    const matchedDemo = DEMO_USERS.find(
      (u) =>
        u.username.toLowerCase() === idInput.toLowerCase() ||
        u.email.toLowerCase() === idInput.toLowerCase()
    );
    if (matchedDemo && (!password || password === 'password123')) {
      setLocalActiveUser(matchedDemo);
      return { user: matchedDemo, session: {} };
    }

    throw new Error(data.error || 'Invalid User ID or Password. Please check credentials or sign up.');
  },

  async loginWithGoogle() {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://404-founders-messenger.vercel.app';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (!error && data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (e) {
      console.warn('Supabase signInWithOAuth error:', e);
    }

    window.location.href = '/api/auth/google';
  },

  async forgotPassword(email: string, turnstileToken?: string) {
    if (turnstileToken) {
      const res = await fetch('/api/auth/turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error('Security verification failed.');
      }
    }

    // Send OTP for password reset
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName: 'User', username: email.split('@')[0] }),
    });
    return res.json();
  },

  async resendVerificationEmail(email: string) {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName: 'User', username: email.split('@')[0] }),
    });
    return res.json();
  },

  async logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_USER_KEY);
      localStorage.removeItem('demo_active_user');
    }
    try {
      await supabase.auth.signOut();
    } catch {}
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const saved = getLocalActiveUser();
    if (saved) {
      // Re-sync with database to get freshest details
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', saved.id)
          .single();
        if (data) {
          setLocalActiveUser(data as Profile);
          return data as Profile;
        }
      } catch {}
      return saved;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profile) {
          setLocalActiveUser(profile as Profile);
          return profile as Profile;
        }
      }
    } catch {}

    return null;
  },
};
