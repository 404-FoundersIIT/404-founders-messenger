import { supabase } from '@/lib/supabase/client';
import { Profile, UserSettings, NotificationPreferences, StatusStory } from '@/types/database';
import { DEMO_USERS, DEMO_STATUSES } from '@/lib/demoData';

export const userService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return DEMO_USERS.find((u) => u.id === userId) || null;
    }
    return data as Profile;
  },

  async getAllProfiles(): Promise<Profile[]> {
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

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data as UserSettings;
  },

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  async searchUsers(query: string): Promise<Profile[]> {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, avatar_url, bio, status_text')
        .or(`full_name.ilike.%${cleanQ}%,username.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%`)
        .limit(30);

      if (!error && data && data.length > 0) {
        return data as Profile[];
      }
    } catch {}

    return DEMO_USERS.filter(
      (u) =>
        u.full_name.toLowerCase().includes(cleanQ) ||
        u.username.toLowerCase().includes(cleanQ) ||
        u.email.toLowerCase().includes(cleanQ)
    );
  },

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    const { error } = await supabase.from('blocked_users').insert({
      user_id: userId,
      blocked_user_id: blockedUserId,
    });
    if (error) throw error;
  },

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId);
    if (error) throw error;
  },

  async isUserBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const { data } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(user_id.eq.${userId},blocked_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},blocked_user_id.eq.${userId})`);

    return (data && data.length > 0) || false;
  },

  async reportUser(params: {
    reporterId: string;
    reportedUserId?: string;
    reportedChatId?: string;
    reportedMessageId?: string;
    reason: 'Spam' | 'Abuse' | 'Harassment' | 'Inappropriate content' | 'Other';
    details?: string;
  }): Promise<void> {
    const { error } = await supabase.from('reported_users').insert(params);
    if (error) throw error;
  },

  async getStatuses(): Promise<StatusStory[]> {
    try {
      const { data, error } = await supabase
        .from('status')
        .select(`
          id, user_id, status_type, content, media_url, background_color, caption, expires_at, created_at,
          profile:user_id (id, full_name, username, avatar_url),
          views:status_views (id, viewer_id, viewed_at, viewer:viewer_id(full_name))
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as unknown as StatusStory[];
      }
    } catch {}

    return DEMO_STATUSES;
  },

  async createStatus(params: {
    userId: string;
    statusType: 'text' | 'image' | 'video';
    content?: string;
    mediaUrl?: string;
    backgroundColor?: string;
    caption?: string;
  }): Promise<void> {
    const { error } = await supabase.from('status').insert({
      user_id: params.userId,
      status_type: params.statusType,
      content: params.content || null,
      media_url: params.mediaUrl || null,
      background_color: params.backgroundColor || '#075e54',
      caption: params.caption || null,
      expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    });

    if (error) {
      console.error('Create status error:', error);
      throw error;
    }
  },

  async viewStatus(statusId: string, viewerId: string): Promise<void> {
    try {
      await supabase.from('status_views').upsert({
        status_id: statusId,
        viewer_id: viewerId,
        viewed_at: new Date().toISOString(),
      });
    } catch {}
  },
};
