import { supabase } from '@/lib/supabase/client';
import { NotificationItem } from '@/types/database';

export const notificationService = {
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) {
      return [
        {
          id: 'notif_1',
          user_id: userId,
          type: 'group_added',
          title: 'Welcome to 404 Founders',
          message: 'Explore chats, peer calls, files, and voice notes.',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ];
    }

    return data as NotificationItem[];
  },

  async markAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  },

  async markAllAsRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
  },

  async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  showBrowserNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/logo.png',
          badge: '/logo.png',
          ...options,
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }
  },
};
