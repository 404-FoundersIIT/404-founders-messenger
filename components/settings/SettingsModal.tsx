'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Profile, UserSettings } from '@/types/database';
import {
  User,
  Shield,
  Bell,
  Moon,
  Sun,
  Globe,
  Camera,
  Check,
  LogOut,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onUpdateProfile: (name: string, username: string, bio: string, avatarFile?: File) => void;
  onLogout: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onLogout,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications' | 'appearance'>('profile');

  // Profile Form
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Privacy Settings
  const [lastSeen, setLastSeen] = useState('everyone');
  const [readReceipts, setReadReceipts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`404_read_receipts_${currentUser.id}`);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [typingIndicator, setTypingIndicator] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`404_typing_indicator_${currentUser.id}`);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [isPrivateAccount, setIsPrivateAccount] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`404_private_account_${currentUser.id}`) === 'true';
    }
    return false;
  });

  const handleToggleReadReceipts = (checked: boolean) => {
    setReadReceipts(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`404_read_receipts_${currentUser.id}`, checked ? 'true' : 'false');
    }
  };

  const handleToggleTypingIndicator = (checked: boolean) => {
    setTypingIndicator(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`404_typing_indicator_${currentUser.id}`, checked ? 'true' : 'false');
    }
  };

  const handleTogglePrivate = (checked: boolean) => {
    setIsPrivateAccount(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`404_private_account_${currentUser.id}`, checked ? 'true' : 'false');
    }
  };

  // Notification Settings
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(fullName.trim(), username.trim(), bio.trim(), avatarFile || undefined);
    onClose();
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="md">
      <div className="flex flex-col sm:flex-row gap-4 h-[440px]">
        {/* Settings Navigation Sidebar */}
        <div className="w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 pb-2 sm:pb-0 sm:pr-3 flex sm:flex-col gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-left transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-left transition-colors whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" /> Privacy
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-left transition-colors whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-left transition-colors whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4" /> Appearance
          </button>

          <div className="hidden sm:block mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 overflow-y-auto px-1 text-xs">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer">
                  <Avatar name={fullName} src={avatarPreview} size="xl" />
                  <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Profile Photo
                  </h4>
                  <p className="text-[11px] text-slate-400">Upload your own photo or use initials.</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Bio / About
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm">
                  Save Profile
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Last Seen & Online
                </label>
                <select
                  value={lastSeen}
                  onChange={(e) => setLastSeen(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Read Receipts
                  </div>
                  <div className="text-[11px] text-slate-400">
                    If turned off, you won’t send or receive read receipts (✓✓ blue).
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={readReceipts}
                  onChange={(e) => handleToggleReadReceipts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Typing Indicator
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Let others see when you are typing messages.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={typingIndicator}
                  onChange={(e) => handleToggleTypingIndicator(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Private Account Toggle */}
              <div className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="pr-3">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Private Account</span>
                    {isPrivateAccount && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Private
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Hide your profile from the general public users directory. Other users can only discover and contact you by searching your exact @username.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivateAccount}
                  onChange={(e) => handleTogglePrivate(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 shrink-0 mt-0.5 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Push Notifications
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Receive sound & badge notifications for messages and calls.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushNotifs}
                  onChange={(e) => setPushNotifs(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    SMTP Email Notifications
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Send email summary via Resend SMTP when offline.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Color Theme
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                    theme === 'light'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="font-medium">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                    theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-medium">Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                    theme === 'system'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="font-medium">System</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
