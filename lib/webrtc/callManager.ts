// ========================================================
// 404 FOUNDERS - WEBRTC CALLING ENGINE
// Audio & Video peer-to-peer with STUN and Supabase signaling
// ========================================================

import { supabase } from '@/lib/supabase/client';
import { CallType } from '@/types/database';

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
  ],
};

export class CallRingtone {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;

  startRinging() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      const playTone = () => {
        if (!this.ctx || this.ctx.state === 'closed') return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.2);
      };

      playTone();
      this.intervalId = setInterval(playTone, 3000);
    } catch (e) {
      console.warn('AudioContext not allowed or not supported:', e);
    }
  }

  stopRinging() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export interface SignalingPayload {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-ended' | 'call-rejected' | 'ready';
  senderId: string;
  targetId?: string;
  callId: string;
  callType?: CallType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export class WebRTCCallSession {
  public peerConnection: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public channel: any = null;
  public ringtone: CallRingtone = new CallRingtone();

  private pendingCandidates: RTCIceCandidateInit[] = [];
  private localIceCandidates: RTCIceCandidateInit[] = [];
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onConnectedCallback?: () => void;
  private onCallEndCallback?: () => void;
  private isTerminated = false;

  constructor(
    public callId: string,
    public currentUserId: string,
    public targetUserId: string,
    public callType: CallType,
    onRemoteStream?: (stream: MediaStream) => void,
    onCallEnd?: () => void,
    onConnected?: () => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onCallEndCallback = onCallEnd;
    this.onConnectedCallback = onConnected;
  }

  async initialize(isInitiator: boolean): Promise<MediaStream> {
    this.isTerminated = false;

    // 1. Get user media (microphone and camera) with high quality constraints
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video:
          this.callType === 'video'
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
            : false,
      });
    } catch (e) {
      console.warn('getUserMedia failed, trying audio only fallback:', e);
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
    }

    // 2. Set up RTCPeerConnection
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    // Attach local tracks
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    // Connection state changes
    const checkConnected = () => {
      const pc = this.peerConnection;
      if (!pc || this.isTerminated) return;
      const isConn =
        pc.connectionState === 'connected' ||
        pc.iceConnectionState === 'connected' ||
        pc.iceConnectionState === 'completed';

      if (isConn) {
        this.ringtone.stopRinging();
        if (this.onConnectedCallback) this.onConnectedCallback();
      } else if (pc.connectionState === 'failed' || pc.iceConnectionState === 'failed') {
        this.terminate('call-ended');
      }
    };

    this.peerConnection.onconnectionstatechange = checkConnected;
    this.peerConnection.oniceconnectionstatechange = checkConnected;

    // Listen for remote tracks
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) this.remoteStream = new MediaStream();
        this.remoteStream.addTrack(event.track);
      }
      if (this.onRemoteStreamCallback && this.remoteStream) {
        // Provide a fresh MediaStream instance wrapping all tracks to ensure React state update fires
        this.onRemoteStreamCallback(new MediaStream(this.remoteStream.getTracks()));
      }
      checkConnected();
    };

    // ICE candidate generation
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const c = event.candidate.toJSON();
        this.localIceCandidates.push(c);
        this.sendSignal({
          type: 'ice-candidate',
          senderId: this.currentUserId,
          targetId: this.targetUserId,
          callId: this.callId,
          candidate: c,
        }).catch(() => {});
      }
    };

    // 3. Connect Supabase Realtime signaling channel
    this.channel = supabase.channel(`call:${this.callId}`, {
      config: { broadcast: { self: false } },
    });

    this.channel
      .on('broadcast', { event: 'signal' }, async ({ payload }: { payload: SignalingPayload }) => {
        if (!payload || payload.callId !== this.callId) return;
        if (payload.senderId === this.currentUserId) return;

        if (payload.type === 'ready' && isInitiator) {
          // Callee has joined the room and is ready! Send offer now!
          await this.sendOffer();
        } else if (payload.type === 'offer' && payload.sdp && !isInitiator) {
          await this.handleOffer(payload.sdp);
        } else if (payload.type === 'answer' && payload.sdp && isInitiator) {
          await this.handleAnswer(payload.sdp);
        } else if (payload.type === 'ice-candidate' && payload.candidate) {
          await this.handleIceCandidate(payload.candidate);
        } else if (payload.type === 'call-ended' || payload.type === 'call-rejected') {
          this.terminate(payload.type);
        }
      })
      .on('broadcast', { event: 'call-ended' }, () => {
        this.terminate('call-ended');
      })
      .on('broadcast', { event: 'call-rejected' }, () => {
        this.terminate('call-rejected');
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          if (!isInitiator) {
            // Callee tells caller: "I'm connected to the channel, ready for offer!"
            const sendReady = () => {
              if (this.isTerminated) return;
              this.sendSignal({
                type: 'ready',
                senderId: this.currentUserId,
                targetId: this.targetUserId,
                callId: this.callId,
              }).catch(() => {});
            };
            sendReady();
            setTimeout(sendReady, 300);
            setTimeout(sendReady, 700);
          } else {
            // Initiator sends initial offer
            this.sendOffer().catch(() => {});
          }
        }
      });

    if (isInitiator) {
      this.ringtone.startRinging();
    }

    return this.localStream;
  }

  private async sendOffer() {
    if (!this.peerConnection || this.isTerminated) return;
    try {
      let offer = this.peerConnection.localDescription;
      // If we don't have an offer yet, or if signaling state is stable, create it
      if (!offer || this.peerConnection.signalingState === 'stable') {
        const createdOffer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: this.callType === 'video',
        });
        await this.peerConnection.setLocalDescription(createdOffer);
        offer = this.peerConnection.localDescription;
      }

      if (offer) {
        await this.sendSignal({
          type: 'offer',
          senderId: this.currentUserId,
          targetId: this.targetUserId,
          callId: this.callId,
          callType: this.callType,
          sdp: offer,
        });

        // Re-send all local ICE candidates gathered
        this.resendLocalIceCandidates();
      }
    } catch (e) {
      console.warn('Error creating/sending offer:', e);
    }
  }

  private resendLocalIceCandidates() {
    for (const candidate of this.localIceCandidates) {
      this.sendSignal({
        type: 'ice-candidate',
        senderId: this.currentUserId,
        targetId: this.targetUserId,
        callId: this.callId,
        candidate,
      }).catch(() => {});
    }
  }

  private async handleOffer(sdp: RTCSessionDescriptionInit) {
    if (!this.peerConnection || this.isTerminated) return;
    try {
      if (this.peerConnection.signalingState !== 'stable') {
        if (this.peerConnection.signalingState === 'have-local-offer') {
          await this.peerConnection.setLocalDescription({ type: 'rollback' });
        }
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      this.flushPendingCandidates();

      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.callType === 'video',
      });
      await this.peerConnection.setLocalDescription(answer);

      await this.sendSignal({
        type: 'answer',
        senderId: this.currentUserId,
        targetId: this.targetUserId,
        callId: this.callId,
        sdp: answer,
      });

      this.resendLocalIceCandidates();
    } catch (e) {
      console.warn('Error handling offer:', e);
    }
  }

  private async handleAnswer(sdp: RTCSessionDescriptionInit) {
    if (!this.peerConnection || this.isTerminated) return;
    try {
      this.ringtone.stopRinging();
      if (this.peerConnection.signalingState === 'have-local-offer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        this.flushPendingCandidates();
      }
      if (this.onConnectedCallback) {
        this.onConnectedCallback();
      }
    } catch (e) {
      console.warn('Error handling answer:', e);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      // Remote description not set yet; queue candidate
      this.pendingCandidates.push(candidate);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('Error adding ICE candidate:', e);
    }
  }

  private flushPendingCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.pendingCandidates.length > 0) {
      const cand = this.pendingCandidates.shift();
      if (cand) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      }
    }
  }

  private async sendSignal(payload: SignalingPayload) {
    if (this.channel) {
      try {
        await this.channel.send({
          type: 'broadcast',
          event: 'signal',
          payload,
        });
      } catch (err) {
        console.warn('sendSignal broadcast failed:', err);
      }
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  terminate(reason: 'call-ended' | 'call-rejected' = 'call-ended') {
    if (this.isTerminated) return;
    this.isTerminated = true;

    this.ringtone.stopRinging();

    // 1. Broadcast to call channel with both signal and explicit events
    if (this.channel) {
      this.sendSignal({
        type: reason,
        senderId: this.currentUserId,
        callId: this.callId,
      }).catch(() => {});

      this.channel.send({
        type: 'broadcast',
        event: reason,
        payload: { callId: this.callId, senderId: this.currentUserId },
      }).catch(() => {});
    }

    // 2. Broadcast to target's personal inbox channel
    if (this.targetUserId) {
      const inboxCh = supabase.channel(`user:${this.targetUserId}`);
      inboxCh.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          inboxCh.send({
            type: 'broadcast',
            event: reason,
            payload: { callId: this.callId, senderId: this.currentUserId },
          }).then(() => {
            setTimeout(() => supabase.removeChannel(inboxCh), 1000);
          }).catch(() => {});
        }
      });
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Keep channel open briefly (500ms) so outbound broadcast packets are transmitted before closing
    if (this.channel) {
      const ch = this.channel;
      this.channel = null;
      setTimeout(() => {
        supabase.removeChannel(ch);
      }, 500);
    }

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }
  }
}
