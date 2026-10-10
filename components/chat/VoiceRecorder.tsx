'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Start recording automatically when mounted
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startRecording() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Determine supported mime type across browsers
        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mimeType = 'audio/ogg';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          }
        }

        const mediaRecorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined
        );
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const resolvedType = mediaRecorder.mimeType || mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: resolvedType });
          setRecordedBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
        };

        mediaRecorder.start(100);
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Microphone access denied:', err);
        alert('Microphone access is required to record voice messages.');
        onCancel();
      }
    }

    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCancel]);

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTogglePlay = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSend = () => {
    if (recordedBlob) {
      onSendVoice(recordedBlob, duration);
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.addEventListener(
        'stop',
        () => {
          const resolvedType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: resolvedType });
          onSendVoice(blob, duration);
        },
        { once: true }
      );
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full bg-slate-100 dark:bg-slate-800/90 px-3 py-2 rounded-xl animate-fade-in">
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 text-slate-500 hover:text-red-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        title="Cancel voice note"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording Indicator & Animated Waveform */}
      <div className="flex-1 flex items-center gap-3">
        {isRecording ? (
          <>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
              {formatDuration(duration)}
            </span>
            {/* Waveform bars simulation */}
            <div className="flex items-center gap-0.5 flex-1 h-5 overflow-hidden">
              {[40, 70, 30, 90, 50, 80, 20, 60, 100, 45, 75, 35, 85, 55, 95].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-emerald-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="p-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
              {formatDuration(duration)}
            </span>
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full" />
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {isRecording && (
        <button
          type="button"
          onClick={handleStopRecording}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Stop recording"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      )}

      <button
        type="button"
        onClick={handleSend}
        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform active:scale-95 shadow-sm"
        title="Send voice message"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
