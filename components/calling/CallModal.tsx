'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CallType } from '@/types/database';
import { Avatar } from '@/components/ui/Avatar';
import { formatDuration } from '@/lib/utils';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface CallModalProps {
  callId: string;
  calleeName: string;
  calleeAvatar?: string | null;
  callType: CallType;
  status: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  durationSeconds: number;
  onToggleMic: (muted: boolean) => void;
  onToggleVideo: (videoOn: boolean) => void;
  onEndCall: () => void;
}

export function CallModal({
  callId,
  calleeName,
  calleeAvatar,
  callType,
  status,
  localStream,
  remoteStream,
  durationSeconds,
  onToggleMic,
  onToggleVideo,
  onEndCall,
}: CallModalProps) {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Bind local media stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote media stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }

    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch((err) => {
        console.warn('remoteAudio playback error:', err);
      });
    }
  }, [remoteStream, callType]);

  const handleMicToggle = () => {
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);
    onToggleMic(nextState);
  };

  const handleVideoToggle = () => {
    const nextState = !isVideoDisabled;
    setIsVideoDisabled(nextState);
    onToggleVideo(!nextState);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none animate-fade-in">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div>
          <h3 className="text-base font-bold">{calleeName}</h3>
          <p className="text-xs text-slate-300">
            {status === 'connected' ? formatDuration(durationSeconds) : status.toUpperCase()}
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {callType === 'video' ? (
          <>
            {/* Remote video (Full screen) - muted because dedicated remoteAudioRef plays audio */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* When remote video not available yet, show avatar */}
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                <Avatar name={calleeName} src={calleeAvatar} size="2xl" className="mb-4" />
                <h4 className="text-lg font-semibold">{calleeName}</h4>
                <p className="text-xs text-slate-400 mt-1">{status}...</p>
              </div>
            )}

            {/* Local video (Picture in Picture bottom right) */}
            <div className="absolute bottom-6 right-6 w-36 h-48 sm:w-44 sm:h-60 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
              />
              {isVideoDisabled && (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs text-slate-400">
                  Camera off
                </div>
              )}
            </div>
          </>
        ) : (
          /* Audio Call Presentation */
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              <Avatar name={calleeName} src={calleeAvatar} size="2xl" />
              {status === 'connected' && (
                <div className="absolute -inset-2 rounded-full border-2 border-emerald-500/60 animate-ping pointer-events-none" />
              )}
            </div>
            <h4 className="text-xl font-bold">{calleeName}</h4>
            <p className="text-sm text-slate-400 mt-2">
              {status === 'connected' ? 'Audio call in progress' : 'Calling...'}
            </p>
            {status === 'connected' && (
              <p className="text-lg font-mono text-emerald-400 mt-3">
                {formatDuration(durationSeconds)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Call Controls Bar */}
      <div className="p-6 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-6 z-10">
        {/* Mic Toggle */}
        <button
          type="button"
          onClick={handleMicToggle}
          className={`p-4 rounded-full transition-transform active:scale-95 ${
            isMicMuted ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Video Toggle (if video call) */}
        {callType === 'video' && (
          <button
            type="button"
            onClick={handleVideoToggle}
            className={`p-4 rounded-full transition-transform active:scale-95 ${
              isVideoDisabled ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isVideoDisabled ? 'Turn camera on' : 'Turn camera off'}
          >
            {isVideoDisabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          type="button"
          onClick={onEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-transform active:scale-95 shadow-lg shadow-red-600/30"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        {/* Reliable audio output for remote WebRTC stream without display:none suppression */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          style={{
            position: 'fixed',
            opacity: 0,
            pointerEvents: 'none',
            width: '1px',
            height: '1px',
            bottom: 0,
            right: 0,
          }}
        />
      </div>
    </div>
  );
}
