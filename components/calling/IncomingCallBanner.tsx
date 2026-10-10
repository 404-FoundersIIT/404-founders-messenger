'use client';

import React, { useEffect, useRef } from 'react';
import { CallType } from '@/types/database';
import { Avatar } from '@/components/ui/Avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallBannerProps {
  callerName: string;
  callerAvatar?: string | null;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallBanner({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onDecline,
}: IncomingCallBannerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);

  // Synthesize an audible phone ringing sound using Web Audio API
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const playRingBurst = () => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // US standard ringtone freq 1
        osc2.frequency.setValueAtTime(480, now); // US standard ringtone freq 2

        // Burst 1 (0.8s)
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.15, now + 0.8);
        gain.gain.setValueAtTime(0.001, now + 0.85);

        // Burst 2 (0.8s after 0.2s pause)
        gain.gain.setValueAtTime(0.15, now + 1.05);
        gain.gain.setValueAtTime(0.15, now + 1.85);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.95);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      };

      playRingBurst();
      ringIntervalRef.current = setInterval(playRingBurst, 3500);
    } catch (e) {
      console.warn('Audio ringtone error:', e);
    }

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  const handleAcceptClick = () => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    onAccept();
  };

  const handleDeclineClick = () => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    onDecline();
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-500/50 p-4 animate-bounce-subtle">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={callerName} src={callerAvatar} size="lg" />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {callerName}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 animate-pulse">
              {callType === 'video' ? (
                <>
                  <Video className="w-3.5 h-3.5" /> Incoming Video Call...
                </>
              ) : (
                <>
                  <Phone className="w-3.5 h-3.5" /> Incoming Audio Call...
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Decline Button */}
          <button
            type="button"
            onClick={handleDeclineClick}
            className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-transform active:scale-95 shadow-lg shadow-red-600/30 flex items-center justify-center"
            title="Decline Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={handleAcceptClick}
            className="p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-95 shadow-lg shadow-emerald-600/30 flex items-center justify-center animate-pulse"
            title="Accept Call"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
