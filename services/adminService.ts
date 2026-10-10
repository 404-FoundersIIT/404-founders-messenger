import { supabase } from '@/lib/supabase/client';
import { ReportedUser, Profile, Chat, StickerPack } from '@/types/database';
import { DEMO_USERS, DEMO_CHATS, DEMO_STICKER_PACKS } from '@/lib/demoData';

export interface AdminStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalReports: number;
  pendingReports: number;
  activeCalls: number;
  totalGroups: number;
}

export const adminService = {
  async getSystemStats(): Promise<AdminStats> {
    try {
      const [usersRes, chatsRes, messagesRes, reportsRes, groupsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('chats').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('reported_users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('chats').select('*', { count: 'exact', head: true }).eq('is_group', true),
      ]);

      return {
        totalUsers: usersRes.count || DEMO_USERS.length,
        totalChats: chatsRes.count || DEMO_CHATS.length,
        totalMessages: messagesRes.count || 50,
        totalReports: 3,
        pendingReports: reportsRes.count || 1,
        activeCalls: 0,
        totalGroups: groupsRes.count || 3,
      };
    } catch {
      return {
        totalUsers: DEMO_USERS.length,
        totalChats: DEMO_CHATS.length,
        totalMessages: 50,
        totalReports: 2,
        pendingReports: 1,
        activeCalls: 0,
        totalGroups: 3,
      };
    }
  },

  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEMO_USERS;
    }
    return data as Profile[];
  },

  async toggleAdminRole(userId: string, isAdmin: boolean): Promise<void> {
    await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId);
  },

  async getReports(): Promise<ReportedUser[]> {
    const { data, error } = await supabase
      .from('reported_users')
      .select(`
        *,
        reporter:reporter_id (id, full_name, username),
        reported_user:reported_user_id (id, full_name, username)
      `)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [
        {
          id: 'rep_1',
          reporter_id: DEMO_USERS[0].id,
          reported_user_id: DEMO_USERS[2].id,
          reason: 'Spam',
          details: 'User testing repetitive automated messages in test room.',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          reporter: DEMO_USERS[0],
          reported_user: DEMO_USERS[2],
        },
      ];
    }

    return data as unknown as ReportedUser[];
  },

  async updateReportStatus(reportId: string, status: 'reviewed' | 'resolved' | 'dismissed'): Promise<void> {
    await supabase.from('reported_users').update({ status }).eq('id', reportId);
  },

  async getStickerPacks(): Promise<StickerPack[]> {
    const { data, error } = await supabase
      .from('sticker_packs')
      .select('*, stickers(*)');

    if (error || !data || data.length === 0) {
      return DEMO_STICKER_PACKS;
    }
    return data as StickerPack[];
  },
};
