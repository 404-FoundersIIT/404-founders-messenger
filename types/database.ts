// ========================================================
// 404 FOUNDERS - DATABASE TYPE DEFINITIONS
// ========================================================

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'document'
  | 'sticker'
  | 'gif'
  | 'location'
  | 'contact'
  | 'poll'
  | 'system';

export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'connected'
  | 'ended'
  | 'rejected'
  | 'missed'
  | 'failed';

export type VisibilityLevel = 'everyone' | 'contacts' | 'nobody';
export type GroupPermissionLevel = 'everyone' | 'admins';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string | null;
  status_text?: string;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  last_seen_visibility: VisibilityLevel;
  profile_photo_visibility: VisibilityLevel;
  about_visibility: VisibilityLevel;
  read_receipts: boolean;
  typing_indicator: boolean;
  group_add_permission: VisibilityLevel;
  call_permission: VisibilityLevel;
  notification_enabled: boolean;
  email_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  new_message_push: boolean;
  new_message_email: boolean;
  group_invite_push: boolean;
  group_invite_email: boolean;
  mention_push: boolean;
  mention_email: boolean;
  missed_call_push: boolean;
  missed_call_email: boolean;
  security_email: boolean;
}

export interface Chat {
  id: string;
  is_group: boolean;
  name?: string | null;
  description?: string | null;
  photo_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  members?: ChatMember[];
  last_message?: Message | null;
  unread_count?: number;
}

export interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  mute_until?: string | null;
  is_archived: boolean;
  is_pinned: boolean;
  profile?: Profile;
}

export interface GroupPermissions {
  chat_id: string;
  who_can_edit_info: GroupPermissionLevel;
  who_can_send_messages: GroupPermissionLevel;
  who_can_add_members: GroupPermissionLevel;
  updated_at: string;
}

export interface GroupInviteLink {
  id: string;
  chat_id: string;
  code: string;
  created_by?: string;
  expires_at?: string;
  is_revoked: boolean;
  created_at: string;
}

export interface MessageMedia {
  id: string;
  message_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  thumbnail_path?: string | null;
  created_at: string;
}

export interface MessageReceipt {
  id: string;
  message_id: string;
  user_id: string;
  delivered_at: string;
  read_at?: string | null;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profile?: Profile;
}

export interface StarredMessage {
  id: string;
  user_id: string;
  message_id: string;
  created_at: string;
  message?: Message;
}

export interface PinnedMessage {
  id: string;
  chat_id: string;
  message_id: string;
  pinned_by?: string;
  created_at: string;
  message?: Message;
}

export interface SharedLocation {
  id: string;
  message_id: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  created_at: string;
}

export interface SharedContact {
  id: string;
  message_id: string;
  contact_user_id?: string | null;
  contact_name: string;
  contact_phone?: string | null;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  sort_order: number;
  vote_count?: number;
  has_voted?: boolean;
}

export interface Poll {
  id: string;
  message_id: string;
  question: string;
  is_multiple_choice: boolean;
  created_at: string;
  options: PollOption[];
  total_votes?: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id?: string | null;
  message_type: MessageType;
  text?: string | null;
  reply_to_message_id?: string | null;
  forwarded_from_message_id?: string | null;
  is_edited: boolean;
  edited_at?: string | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_for_users?: string[];
  created_at: string;
  updated_at: string;
  // Joined relations
  sender?: Profile;
  reply_to?: Message | null;
  media?: MessageMedia[];
  receipts?: MessageReceipt[];
  reactions?: MessageReaction[];
  poll?: Poll | null;
  location?: SharedLocation | null;
  contact?: SharedContact | null;
}

export interface StickerPack {
  id: string;
  name: string;
  description?: string;
  author: string;
  icon_url: string;
  is_official: boolean;
  created_at: string;
  stickers?: Sticker[];
}

export interface Sticker {
  id: string;
  pack_id: string;
  image_url: string;
  emoji_tag?: string;
  created_at: string;
}

export interface StatusStory {
  id: string;
  user_id: string;
  status_type: 'text' | 'image' | 'video';
  content?: string | null;
  media_url?: string | null;
  background_color?: string;
  caption?: string | null;
  expires_at: string;
  created_at: string;
  profile?: Profile;
  views?: StatusView[];
  viewed_by_me?: boolean;
}

export interface StatusView {
  id: string;
  status_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: Profile;
}

export interface Call {
  id: string;
  chat_id?: string | null;
  caller_id?: string | null;
  call_type: CallType;
  is_group: boolean;
  status: CallStatus;
  started_at?: string | null;
  ended_at?: string | null;
  duration: number;
  created_at: string;
  caller?: Profile;
  participants?: CallParticipant[];
}

export interface CallParticipant {
  id: string;
  call_id: string;
  user_id: string;
  role: 'caller' | 'callee';
  status: 'calling' | 'ringing' | 'connected' | 'declined' | 'missed' | 'disconnected';
  joined_at?: string | null;
  left_at?: string | null;
  profile?: Profile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type:
    | 'new_message'
    | 'group_invite'
    | 'group_added'
    | 'mention'
    | 'missed_call'
    | 'security'
    | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface ReportedUser {
  id: string;
  reporter_id: string;
  reported_user_id?: string | null;
  reported_chat_id?: string | null;
  reported_message_id?: string | null;
  reason: 'Spam' | 'Abuse' | 'Harassment' | 'Inappropriate content' | 'Other';
  details?: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Profile;
  reported_user?: Profile;
}
