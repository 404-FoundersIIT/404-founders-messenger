'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chatService } from '@/services/chatService';
import { authService } from '@/services/authService';
import { Chat, Profile } from '@/types/database';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Users, Loader2, XCircle, CheckCircle2 } from 'lucide-react';

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const user = await authService.getCurrentProfile();
        setCurrentUser(user);

        const details = await chatService.getInviteLinkDetails(code);
        if (details) {
          setChat(details.chat);
        } else {
          // If in local demo mode with sample invite code
          if (code === 'founders-core-2026') {
            const demoChat = await chatService.getChatDetails('20000000-0000-0000-0000-000000000001');
            setChat(demoChat as Chat);
          } else {
            setError('This group invite link is invalid or has expired.');
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load group details.');
      } finally {
        setLoading(false);
      }
    }

    if (code) load();
  }, [code]);

  const handleJoin = async () => {
    if (!currentUser) {
      router.push(`/auth/login?redirect=/join/${code}`);
      return;
    }

    setJoining(true);
    try {
      const chatId = await chatService.joinGroupByInviteCode(code, currentUser.id);
      router.push(`/chat?id=${chatId}`);
    } catch (err: any) {
      // In demo mode fallback
      if (chat) {
        router.push(`/chat?id=${chat.id}`);
      } else {
        setError(err?.message || 'Could not join group.');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center animate-fade-in">
        {loading ? (
          <div className="space-y-4 py-8">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Checking invitation link...</p>
          </div>
        ) : error || !chat ? (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 rounded-full flex items-center justify-center text-red-600 mx-auto">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Invalid Invite Link
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {error || 'The invite link has been revoked or expired.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push('/chat')}>
              Return to Messenger
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <Avatar name={chat.name || 'Group'} src={chat.photo_url} size="xl" className="mx-auto" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{chat.name}</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {chat.description || 'Join this group conversation on 404 Founders.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{chat.members?.length || 10} participants</span>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleJoin}
              isLoading={joining}
            >
              Join Group
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
