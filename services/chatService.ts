import { supabase } from '@/lib/supabase/client';
import { Chat, ChatMember, Profile, GroupInviteLink } from '@/types/database';

export const chatService = {
  async getChats(userId: string): Promise<Chat[]> {
    try {
      // 1. Fetch only the chats where the current user is an active member
      const { data: memberEntries, error: memberError } = await supabase
        .from('chat_members')
        .select('chat_id, role, last_read_at, is_muted, mute_until, is_archived, is_pinned')
        .eq('user_id', userId);

      if (memberError || !memberEntries || memberEntries.length === 0) {
        return [];
      }

      const chatIds = memberEntries.map((m) => m.chat_id);

      // 2. Fetch full chat metadata, members, and messages for these chats
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id, is_group, name, description, photo_url, created_by, created_at, updated_at,
          chat_members (
            id, chat_id, user_id, role, joined_at, last_read_at, is_muted, is_archived, is_pinned,
            profiles:user_id (id, full_name, username, avatar_url, bio, status_text)
          ),
          messages (
            id, sender_id, message_type, text, created_at, is_deleted
          )
        `)
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      if (chatsError || !chats) {
        return [];
      }

      return (chats as any[]).map((chat) => {
        const myMembership = chat.chat_members?.find((m: any) => m.user_id === userId);
        const members: ChatMember[] = (chat.chat_members || []).map((m: any) => ({
          ...m,
          profile: m.profiles as Profile,
        }));

        let chatName = chat.name;
        let chatPhoto = chat.photo_url;

        // For 1-on-1 private direct chats: display the other participant's profile info and about/bio
        let chatDescription = chat.description;
        if (!chat.is_group) {
          const otherMember = members.find((m) => m.user_id !== userId);
          if (otherMember && otherMember.profile) {
            chatName = otherMember.profile.full_name || `@${otherMember.profile.username}`;
            chatPhoto = otherMember.profile.avatar_url;
            chatDescription = otherMember.profile.bio || otherMember.profile.status_text || 'Available';
          } else {
            chatName = 'Private Chat';
            chatDescription = 'Available';
          }
        }

        // Sort messages to get the latest message
        const sortedMessages = [...(chat.messages || [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastMessage = sortedMessages[0] || null;

        // Calculate unread count based on last_read_at
        const lastRead = myMembership?.last_read_at ? new Date(myMembership.last_read_at).getTime() : 0;
        const unreadCount = sortedMessages.filter(
          (m) => m.sender_id !== userId && new Date(m.created_at).getTime() > lastRead
        ).length;

        return {
          id: chat.id,
          is_group: chat.is_group,
          name: chatName,
          description: chatDescription,
          photo_url: chatPhoto,
          created_by: chat.created_by,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          members,
          last_message: lastMessage,
          unread_count: unreadCount,
          is_pinned: myMembership?.is_pinned || false,
          is_archived: myMembership?.is_archived || false,
          is_muted: myMembership?.is_muted || false,
        } as Chat;
      });
    } catch (e) {
      console.error('Failed to load user chats:', e);
      return [];
    }
  },

  async createDirectChat(currentUserId: string, targetUserId: string): Promise<string> {
    try {
      // 1. Check if private chat already exists between these 2 users
      const { data: myChats } = await supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', currentUserId);

      if (myChats && myChats.length > 0) {
        const myChatIds = myChats.map((c) => c.chat_id);
        const { data: sharedChats } = await supabase
          .from('chat_members')
          .select('chat_id, chats!inner(is_group)')
          .eq('user_id', targetUserId)
          .in('chat_id', myChatIds);

        const existingDirect = sharedChats?.find((s: any) => s.chats?.is_group === false);
        if (existingDirect) {
          return existingDirect.chat_id;
        }
      }

      // 2. Create new direct chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ is_group: false, created_by: currentUserId })
        .select('id')
        .single();

      if (chatError || !newChat) {
        throw new Error(chatError?.message || 'Failed to create chat');
      }

      // 3. Add both users as members
      await supabase.from('chat_members').insert([
        { chat_id: newChat.id, user_id: currentUserId, role: 'member' },
        { chat_id: newChat.id, user_id: targetUserId, role: 'member' },
      ]);

      return newChat.id;
    } catch (e: any) {
      console.error('Error creating direct chat:', e);
      throw e;
    }
  },

  async createGroupChat(
    currentUserId: string,
    params: { name: string; description?: string; photoUrl?: string | null; memberIds: string[] }
  ): Promise<string> {
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        is_group: true,
        name: params.name.trim(),
        description: params.description?.trim() || '',
        photo_url: params.photoUrl || null,
        created_by: currentUserId,
      })
      .select('id')
      .single();

    if (chatError || !newChat) {
      throw new Error(chatError?.message || 'Failed to create group');
    }

    // Add creator as admin, others as members
    const membersToInsert = [
      { chat_id: newChat.id, user_id: currentUserId, role: 'admin' },
      ...params.memberIds
        .filter((id) => id !== currentUserId)
        .map((id) => ({ chat_id: newChat.id, user_id: id, role: 'member' })),
    ];

    await supabase.from('chat_members').insert(membersToInsert);
    await supabase.from('group_permissions').insert({ chat_id: newChat.id });

    return newChat.id;
  },

  async getChatDetails(chatId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id, is_group, name, description, photo_url, created_by, created_at, updated_at,
        chat_members (
          id, chat_id, user_id, role, joined_at, last_read_at, is_muted, is_pinned, is_archived,
          profiles:user_id (id, full_name, username, email, avatar_url, bio, status_text)
        )
      `)
      .eq('id', chatId)
      .single();

    if (error || !data) return null;
    return data;
  },

  async updateGroupInfo(chatId: string, info: { name?: string; description?: string; photoUrl?: string }) {
    const { error } = await supabase
      .from('chats')
      .update({
        ...(info.name ? { name: info.name.trim() } : {}),
        ...(info.description !== undefined ? { description: info.description.trim() } : {}),
        ...(info.photoUrl !== undefined ? { photo_url: info.photoUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId);

    if (error) throw error;
  },

  async addMemberToGroup(chatId: string, userId: string, role: 'admin' | 'member' = 'member') {
    const { error } = await supabase.from('chat_members').upsert({
      chat_id: chatId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  async removeMemberFromGroup(chatId: string, userId: string) {
    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async markAsRead(chatId: string, userId: string) {
    try {
      await supabase
        .from('chat_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', userId);
    } catch {}
  },

  async pinChat(chatId: string, userId: string, isPinned: boolean) {
    await supabase
      .from('chat_members')
      .update({ is_pinned: isPinned })
      .eq('chat_id', chatId)
      .eq('user_id', userId);
  },

  async archiveChat(chatId: string, userId: string, isArchived: boolean) {
    await supabase
      .from('chat_members')
      .update({ is_archived: isArchived })
      .eq('chat_id', chatId)
      .eq('user_id', userId);
  },

  async muteChat(chatId: string, userId: string, isMuted: boolean, muteUntil?: string) {
    await supabase
      .from('chat_members')
      .update({ is_muted: isMuted, mute_until: muteUntil || null })
      .eq('chat_id', chatId)
      .eq('user_id', userId);
  },

  async getOrCreateGroupInviteLink(chatId: string, createdBy: string): Promise<string> {
    try {
      const { data: existing } = await supabase
        .from('group_invite_links')
        .select('code')
        .eq('chat_id', chatId)
        .eq('is_revoked', false)
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0].code;
      }

      const code = `grp-${chatId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;
      const { data: created, error } = await supabase
        .from('group_invite_links')
        .insert({
          chat_id: chatId,
          created_by: createdBy,
          code,
          is_revoked: false,
        })
        .select('code')
        .single();

      if (error || !created) {
        return code;
      }
      return created.code;
    } catch {
      return `grp-${chatId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;
    }
  },

  async getInviteLinkDetails(code: string) {
    try {
      const { data: link } = await supabase
        .from('group_invite_links')
        .select('chat_id, is_revoked, expires_at')
        .eq('code', code)
        .single();

      let targetChatId = link?.chat_id;
      if (!targetChatId && code.startsWith('grp-')) {
        const rawPrefix = code.replace('grp-', '');
        const { data: matchedChat } = await supabase
          .from('chats')
          .select('id')
          .eq('is_group', true)
          .ilike('id', `${rawPrefix}%`)
          .limit(1)
          .single();
        if (matchedChat) targetChatId = matchedChat.id;
      }

      if (!targetChatId) return null;

      const chat = await this.getChatDetails(targetChatId);
      return { chat };
    } catch {
      return null;
    }
  },

  async joinGroupByInviteCode(code: string, userId: string): Promise<string> {
    let targetChatId: string | null = null;
    const { data: link } = await supabase
      .from('group_invite_links')
      .select('chat_id, is_revoked')
      .eq('code', code)
      .single();

    if (link && !link.is_revoked) {
      targetChatId = link.chat_id;
    } else if (code.startsWith('grp-')) {
      const rawPrefix = code.replace('grp-', '');
      const { data: matchedChat } = await supabase
        .from('chats')
        .select('id')
        .eq('is_group', true)
        .ilike('id', `${rawPrefix}%`)
        .limit(1)
        .single();
      if (matchedChat) targetChatId = matchedChat.id;
    }

    if (!targetChatId) {
      throw new Error('Invalid or revoked invite link');
    }

    await this.addMemberToGroup(targetChatId, userId);
    return targetChatId;
  },
};
