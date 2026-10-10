import { supabase } from '@/lib/supabase/client';
import { Call, CallType } from '@/types/database';

export const callService = {
  async createCall(callerId: string, calleeId: string, callType: CallType, chatId?: string): Promise<Call> {
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        caller_id: callerId,
        chat_id: chatId || null,
        call_type: callType,
        status: 'ringing',
        started_at: new Date().toISOString(),
      })
      .select('*, caller:caller_id(id, full_name, avatar_url)')
      .single();

    if (callError || !call) {
      // In-memory fallback
      return {
        id: `call_${Date.now()}`,
        caller_id: callerId,
        chat_id: chatId || null,
        call_type: callType,
        is_group: false,
        status: 'ringing',
        started_at: new Date().toISOString(),
        duration: 0,
        created_at: new Date().toISOString(),
      };
    }

    // Add caller and callee to participants
    await supabase.from('call_participants').insert([
      { call_id: call.id, user_id: callerId, role: 'caller', status: 'calling' },
      { call_id: call.id, user_id: calleeId, role: 'callee', status: 'ringing' },
    ]);

    // Broadcast incoming call to callee
    const userChannel = supabase.channel(`user:${calleeId}`);
    await userChannel.send({
      type: 'broadcast',
      event: 'incoming-call',
      payload: {
        callId: call.id,
        callerId,
        callType,
        chatId,
      },
    });

    return call as Call;
  },

  async acceptCall(callId: string, userId: string): Promise<void> {
    await supabase
      .from('calls')
      .update({ status: 'connected' })
      .eq('id', callId);

    await supabase
      .from('call_participants')
      .update({ status: 'connected', joined_at: new Date().toISOString() })
      .eq('call_id', callId)
      .eq('user_id', userId);
  },

  async rejectCall(callId: string, userId: string): Promise<void> {
    await supabase
      .from('calls')
      .update({ status: 'rejected', ended_at: new Date().toISOString() })
      .eq('id', callId);

    await supabase
      .from('call_participants')
      .update({ status: 'declined', left_at: new Date().toISOString() })
      .eq('call_id', callId)
      .eq('user_id', userId);
  },

  async endCall(callId: string, durationSeconds: number = 0): Promise<void> {
    await supabase
      .from('calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration: durationSeconds,
      })
      .eq('id', callId);
  },

  async getCallHistory(userId: string): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        id, chat_id, caller_id, call_type, is_group, status, started_at, ended_at, duration, created_at,
        caller:caller_id (id, full_name, username, avatar_url),
        participants:call_participants (
          id, user_id, role, status,
          profile:user_id (id, full_name, username, avatar_url)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];
    return data as unknown as Call[];
  },
};
