import { supabase } from '@/lib/supabase/client';
import { Message, MessageType, Poll, SharedLocation, SharedContact } from '@/types/database';
import { offlineQueue } from './offlineQueue';

export interface SendMessageOptions {
  chatId: string;
  senderId: string;
  messageType?: MessageType;
  text?: string;
  replyToMessageId?: string | null;
  forwardedFromMessageId?: string | null;
  media?: {
    storagePath: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    duration?: number;
  }[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contact?: {
    contactUserId?: string;
    contactName: string;
    contactPhone?: string;
  };
  poll?: {
    question: string;
    options: string[];
    isMultipleChoice?: boolean;
  };
}

export const messageService = {
  async getMessages(chatId: string, limit: number = 60, beforeDate?: string): Promise<Message[]> {
    try {
      let query = supabase
        .from('messages')
        .select(`
          id, chat_id, sender_id, message_type, text, reply_to_message_id,
          forwarded_from_message_id, is_edited, edited_at, is_deleted, deleted_at,
          deleted_for_users, created_at, updated_at,
          sender:sender_id (id, full_name, username, avatar_url),
          reply_to:reply_to_message_id (id, text, message_type, sender:sender_id (full_name)),
          media:message_media (*),
          receipts:message_receipts (*),
          reactions:message_reactions (id, emoji, user_id, profile:user_id(full_name)),
          location:shared_locations (*),
          contact:shared_contacts (*),
          polls (
            id, question, is_multiple_choice,
            options:poll_options (id, option_text, sort_order, votes:poll_votes(id, user_id, profile:user_id(full_name)))
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (beforeDate) {
        query = query.lt('created_at', beforeDate);
      }

      const { data, error } = await query;
      if (!error && data) {
        let currentUid: string | null = null;
        try {
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('404_active_user') || localStorage.getItem('demo_active_user');
            if (raw) currentUid = JSON.parse(raw)?.id;
          }
        } catch {}

        return data.map((msg: any) => {
          let pollData = null;
          if (msg.polls && msg.polls.length > 0) {
            const rawPoll = msg.polls[0];
            pollData = {
              id: rawPoll.id,
              message_id: msg.id,
              question: rawPoll.question,
              is_multiple_choice: rawPoll.is_multiple_choice,
              created_at: msg.created_at,
              options: (rawPoll.options || []).map((opt: any) => {
                const voterNames = (opt.votes || []).map((v: any) => v.profile?.full_name || 'Member');
                const hasVoted = Boolean(currentUid && opt.votes?.some((v: any) => v.user_id === currentUid));
                return {
                  id: opt.id,
                  poll_id: rawPoll.id,
                  option_text: opt.option_text,
                  sort_order: opt.sort_order,
                  vote_count: opt.votes?.length || 0,
                  has_voted: hasVoted,
                  voters: voterNames,
                };
              }),
            };
          }

          return {
            ...msg,
            poll: pollData,
          } as Message;
        });
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    }

    return [];
  },

  async sendMessage(options: SendMessageOptions): Promise<Message> {
    const {
      chatId,
      senderId,
      messageType = 'text',
      text = '',
      replyToMessageId,
      forwardedFromMessageId,
      media,
      location,
      contact,
      poll,
    } = options;

    if (offlineQueue.isOffline()) {
      throw new Error('Offline: message cached in outbox');
    }

    // 1. Insert message record into PostgreSQL
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        message_type: messageType,
        text,
        reply_to_message_id: replyToMessageId || null,
        forwarded_from_message_id: forwardedFromMessageId || null,
      })
      .select('*, sender:sender_id(id, full_name, username, avatar_url), reply_to:reply_to_message_id(id, text, message_type, sender:sender_id(full_name))')
      .single();

    if (msgError || !msgData) {
      throw new Error(msgError?.message || 'Failed to send message');
    }

    const messageId = msgData.id;

    // 2. Attach media if provided
    let attachedMedia = [];
    if (media && media.length > 0) {
      const { data: mData } = await supabase.from('message_media').insert(
        media.map((m) => ({
          message_id: messageId,
          storage_path: m.storagePath,
          file_name: m.fileName,
          mime_type: m.mimeType,
          file_size: m.fileSize,
          width: m.width || null,
          height: m.height || null,
          duration: m.duration || null,
        }))
      ).select();
      attachedMedia = mData || [];
    }

    // 3. Attach location if provided
    let attachedLocation = null;
    if (location) {
      const { data: locData } = await supabase.from('shared_locations').insert({
        message_id: messageId,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || null,
      }).select().single();
      attachedLocation = locData;
    }

    // 4. Attach contact if provided
    let attachedContact = null;
    if (contact) {
      const { data: cntData } = await supabase.from('shared_contacts').insert({
        message_id: messageId,
        contact_user_id: contact.contactUserId || null,
        contact_name: contact.contactName,
        contact_phone: contact.contactPhone || null,
      }).select().single();
      attachedContact = cntData;
    }

    // 5. Attach poll if provided
    let attachedPoll = null;
    if (poll) {
      const { data: pollRecord } = await supabase
        .from('polls')
        .insert({
          message_id: messageId,
          question: poll.question,
          is_multiple_choice: poll.isMultipleChoice || false,
        })
        .select()
        .single();

      if (pollRecord) {
        const { data: optRecords } = await supabase.from('poll_options').insert(
          poll.options.map((optText, idx) => ({
            poll_id: pollRecord.id,
            option_text: optText,
            sort_order: idx + 1,
          }))
        ).select();

        attachedPoll = {
          id: pollRecord.id,
          message_id: messageId,
          question: pollRecord.question,
          is_multiple_choice: pollRecord.is_multiple_choice,
          created_at: pollRecord.created_at,
          options: (optRecords || []).map((o: any) => ({
            id: o.id,
            poll_id: pollRecord.id,
            option_text: o.option_text,
            sort_order: o.sort_order,
            vote_count: 0,
            has_voted: false,
          })),
        };
      }
    }

    // 6. Update chat updated_at
    await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);

    return {
      ...msgData,
      media: attachedMedia,
      location: attachedLocation,
      contact: attachedContact,
      poll: attachedPoll,
      receipts: [],
      reactions: [],
    } as Message;
  },

  async reactToMessage(messageId: string, userId: string, emoji: string) {
    try {
      // Check existing reactions by this user on this message
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id, emoji')
        .eq('message_id', messageId)
        .eq('user_id', userId);

      // If user clicked the SAME emoji -> remove it (toggle off)
      const sameEmoji = existing?.find((r) => r.emoji === emoji);
      if (sameEmoji) {
        await supabase.from('message_reactions').delete().eq('id', sameEmoji.id);
        return { action: 'removed', emoji };
      }

      // If user had a DIFFERENT reaction -> delete all previous reactions by this user first (strictly 1 reaction per user!)
      if (existing && existing.length > 0) {
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId);
      }

      // Insert new reaction
      const { data: newReaction } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        })
        .select('id, emoji, user_id')
        .single();

      return { action: 'added', reaction: newReaction };
    } catch (e) {
      console.error('Error toggling reaction:', e);
      throw e;
    }
  },

  async votePoll(pollId: string, optionId: string, userId: string, isMultipleChoice: boolean = false) {
    try {
      if (!isMultipleChoice) {
        // Delete any existing vote for this poll by this user (single-vote enforcement)
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', pollId)
          .eq('user_id', userId);
      } else {
        // Toggle if multiple choice
        const { data: existing } = await supabase
          .from('poll_votes')
          .select('id')
          .eq('poll_id', pollId)
          .eq('option_id', optionId)
          .eq('user_id', userId);

        if (existing && existing.length > 0) {
          await supabase.from('poll_votes').delete().eq('id', existing[0].id);
          return { voted: false };
        }
      }

      // Insert vote
      await supabase.from('poll_votes').insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
      });

      return { voted: true };
    } catch (e) {
      console.error('Error voting poll:', e);
      throw e;
    }
  },

  async markMessagesAsRead(chatId: string, userId: string, messageIds?: string[]) {
    try {
      const now = new Date().toISOString();
      let idsToMark = messageIds;

      if (!idsToMark || idsToMark.length === 0) {
        const { data } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', chatId)
          .neq('sender_id', userId);
        idsToMark = data ? data.map((m) => m.id) : [];
      }

      if (!idsToMark || idsToMark.length === 0) return;

      const records = idsToMark.map((mId) => ({
        message_id: mId,
        user_id: userId,
        read_at: now,
      }));

      await supabase.from('message_receipts').upsert(records, {
        onConflict: 'message_id,user_id',
      });
    } catch (e) {
      console.warn('Error marking messages as read:', e);
    }
  },

  async editMessage(messageId: string, newText: string, senderId?: string): Promise<void> {
    let q = supabase
      .from('messages')
      .update({
        text: newText,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (senderId) {
      q = q.eq('sender_id', senderId);
    }

    const { error } = await q;
    if (error) throw error;
  },

  async deleteMessage(messageId: string, senderId?: string): Promise<void> {
    let q = supabase
      .from('messages')
      .update({
        is_deleted: true,
        text: 'This message was deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (senderId) {
      q = q.eq('sender_id', senderId);
    }

    const { error } = await q;
    if (error) throw error;
  },

  async deleteForEveryone(messageId: string, senderId?: string): Promise<void> {
    return this.deleteMessage(messageId, senderId);
  },

  async pinMessage(messageId: string, isPinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: isPinned })
      .eq('id', messageId);
    if (error) throw error;
  },

  async starMessage(messageId: string, isStarred: boolean): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_starred: isStarred })
      .eq('id', messageId);
    if (error) throw error;
  },

  saveMessagesForChat(chatId: string, messages: Message[]) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`404_messages_${chatId}`, JSON.stringify(messages.slice(-50)));
      }
    } catch {}
  },

  async searchMessages(queryText: string, chatId?: string): Promise<Message[]> {
    const cleanQ = queryText.trim().toLowerCase();
    if (!cleanQ) return [];

    try {
      let q = supabase
        .from('messages')
        .select(`
          id, chat_id, sender_id, message_type, text, reply_to_message_id, is_edited, is_deleted, created_at, updated_at,
          sender:sender_id (id, full_name, username, avatar_url),
          media:message_media (id, message_id, storage_path, file_name, mime_type, file_size, duration)
        `)
        .ilike('text', `%${cleanQ}%`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(30);

      if (chatId) {
        q = q.eq('chat_id', chatId);
      }

      const { data, error } = await q;
      if (!error && data) {
        return data as unknown as Message[];
      }
    } catch (e) {
      console.warn('Search messages error:', e);
    }
    return [];
  },
};
