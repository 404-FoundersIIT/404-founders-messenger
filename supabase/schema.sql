-- ========================================================
-- 404 FOUNDERS - REALTIME MESSAGING PLATFORM
-- FULL DATABASE SCHEMA WITH RLS, INDEXES, TRIGGERS, STORAGE
-- ========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 1. PROFILES & USER SETTINGS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    bio TEXT DEFAULT 'Hey there! I am using 404 Founders.',
    avatar_url TEXT,
    status_text TEXT DEFAULT 'Available',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_seen_visibility TEXT DEFAULT 'everyone' CHECK (last_seen_visibility IN ('everyone', 'contacts', 'nobody')),
    profile_photo_visibility TEXT DEFAULT 'everyone' CHECK (profile_photo_visibility IN ('everyone', 'contacts', 'nobody')),
    about_visibility TEXT DEFAULT 'everyone' CHECK (about_visibility IN ('everyone', 'contacts', 'nobody')),
    read_receipts BOOLEAN DEFAULT TRUE,
    typing_indicator BOOLEAN DEFAULT TRUE,
    group_add_permission TEXT DEFAULT 'everyone' CHECK (group_add_permission IN ('everyone', 'contacts', 'nobody')),
    call_permission TEXT DEFAULT 'everyone' CHECK (call_permission IN ('everyone', 'contacts', 'nobody')),
    notification_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    new_message_push BOOLEAN DEFAULT TRUE,
    new_message_email BOOLEAN DEFAULT FALSE,
    group_invite_push BOOLEAN DEFAULT TRUE,
    group_invite_email BOOLEAN DEFAULT TRUE,
    mention_push BOOLEAN DEFAULT TRUE,
    mention_email BOOLEAN DEFAULT TRUE,
    missed_call_push BOOLEAN DEFAULT TRUE,
    missed_call_email BOOLEAN DEFAULT TRUE,
    security_email BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_name TEXT,
    device_type TEXT,
    user_agent TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, contact_user_id)
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, blocked_user_id)
);

-- ========================================================
-- 2. CHATS & MEMBERS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group BOOLEAN DEFAULT FALSE,
    name TEXT,
    description TEXT,
    photo_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    mute_until TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_permissions (
    chat_id UUID PRIMARY KEY REFERENCES public.chats(id) ON DELETE CASCADE,
    who_can_edit_info TEXT DEFAULT 'everyone' CHECK (who_can_edit_info IN ('everyone', 'admins')),
    who_can_send_messages TEXT DEFAULT 'everyone' CHECK (who_can_send_messages IN ('everyone', 'admins')),
    who_can_add_members TEXT DEFAULT 'everyone' CHECK (who_can_add_members IN ('everyone', 'admins')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 3. MESSAGES, MEDIA, REACTIONS, RECEIPTS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_type TEXT DEFAULT 'text' CHECK (
        message_type IN ('text', 'image', 'video', 'audio', 'voice', 'document', 'sticker', 'gif', 'location', 'contact', 'poll', 'system')
    ),
    text TEXT,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    forwarded_from_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_for_users UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.message_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    width INT,
    height INT,
    duration INT,
    thumbnail_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.message_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.starred_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, message_id)
);

CREATE TABLE IF NOT EXISTS public.pinned_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    pinned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id, message_id)
);

CREATE TABLE IF NOT EXISTS public.shared_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shared_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    is_multiple_choice BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, option_id, user_id)
);

-- ========================================================
-- 4. STICKERS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.sticker_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    author TEXT DEFAULT '404 Founders',
    icon_url TEXT NOT NULL,
    is_official BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    emoji_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_sticker_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pack_id UUID NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pack_id)
);

CREATE TABLE IF NOT EXISTS public.recent_stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sticker_id UUID NOT NULL REFERENCES public.stickers(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, sticker_id)
);

-- ========================================================
-- 5. STATUS / STORIES (WhatsApp Style 24h)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_type TEXT DEFAULT 'text' CHECK (status_type IN ('text', 'image', 'video')),
    content TEXT,
    media_url TEXT,
    background_color TEXT DEFAULT '#075e54',
    caption TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.status_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_id UUID NOT NULL REFERENCES public.status(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(status_id, viewer_id)
);

-- ========================================================
-- 6. WEBRTC CALLS & PARTICIPANTS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
    caller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
    is_group BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'failed')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'callee' CHECK (role IN ('caller', 'callee')),
    status TEXT DEFAULT 'calling' CHECK (status IN ('calling', 'ringing', 'connected', 'declined', 'missed', 'disconnected')),
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    UNIQUE(call_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 7. NOTIFICATIONS & REPORTS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_message', 'group_invite', 'group_added', 'mention', 'missed_call', 'security', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reported_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
    reported_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('Spam', 'Abuse', 'Harassment', 'Inappropriate content', 'Other')),
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 8. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ========================================================

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON public.chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_composite ON public.chat_members(chat_id, user_id);

CREATE INDEX IF NOT EXISTS idx_receipts_message_id ON public.message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.message_receipts(user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON public.message_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_user_expires ON public.status(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_status_expires_at ON public.status(expires_at);

CREATE INDEX IF NOT EXISTS idx_calls_caller ON public.calls(caller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_participants_user ON public.call_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Full-text search index on messages text
CREATE INDEX IF NOT EXISTS idx_messages_text_search ON public.messages USING gin(to_tsvector('english', coalesce(text, '')));

-- ========================================================
-- 9. TRIGGERS: AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    raw_username TEXT;
BEGIN
    raw_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    raw_username := COALESCE(
        new.raw_user_meta_data->>'username',
        LOWER(REGEXP_REPLACE(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g')) || '_' || SUBSTRING(new.id::text, 1, 4)
    );

    INSERT INTO public.profiles (id, full_name, username, email, bio, avatar_url)
    VALUES (
        new.id,
        raw_name,
        raw_username,
        new.email,
        'Hey there! I am using 404 Founders.',
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    INSERT INTO public.user_settings (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.notification_preferences (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_chats_updated_at ON public.chats;
CREATE TRIGGER set_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_messages_updated_at ON public.messages;
CREATE TRIGGER set_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ========================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reported_users ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- USER SETTINGS
CREATE POLICY "Users manage own settings" ON public.user_settings
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- NOTIFICATION PREFS
CREATE POLICY "Users manage own notification preferences" ON public.notification_preferences
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- CONTACTS
CREATE POLICY "Users manage own contacts" ON public.contacts
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- BLOCKED USERS
CREATE POLICY "Users manage own blocked list" ON public.blocked_users
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- CHATS: members can view their chats
CREATE POLICY "Users view chats they belong to" ON public.chats
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = chats.id
            AND chat_members.user_id = auth.uid()
        )
    );
CREATE POLICY "Users create chats" ON public.chats
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins or members update group chats" ON public.chats
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = chats.id
            AND chat_members.user_id = auth.uid()
        )
    );

-- CHAT MEMBERS
CREATE POLICY "Users view chat members in their chats" ON public.chat_members
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members cm
            WHERE cm.chat_id = chat_members.chat_id
            AND cm.user_id = auth.uid()
        )
    );
CREATE POLICY "Users insert chat members" ON public.chat_members
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own membership or admins update" ON public.chat_members
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.chat_members cm
            WHERE cm.chat_id = chat_members.chat_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
    );
CREATE POLICY "Users leave chat or admins remove member" ON public.chat_members
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.chat_members cm
            WHERE cm.chat_id = chat_members.chat_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
    );

-- GROUP PERMISSIONS
CREATE POLICY "Group members view group permissions" ON public.group_permissions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = group_permissions.chat_id
            AND chat_members.user_id = auth.uid()
        )
    );
CREATE POLICY "Group admins manage permissions" ON public.group_permissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = group_permissions.chat_id
            AND chat_members.user_id = auth.uid()
            AND chat_members.role = 'admin'
        )
    );

-- GROUP INVITE LINKS
CREATE POLICY "View active invite link" ON public.group_invite_links
    FOR SELECT TO authenticated
    USING (NOT is_revoked);
CREATE POLICY "Group admins manage invite links" ON public.group_invite_links
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = group_invite_links.chat_id
            AND chat_members.user_id = auth.uid()
            AND chat_members.role = 'admin'
        )
    );

-- MESSAGES
CREATE POLICY "Chat members view messages" ON public.messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = messages.chat_id
            AND chat_members.user_id = auth.uid()
        )
    );
CREATE POLICY "Chat members send messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = messages.chat_id
            AND chat_members.user_id = auth.uid()
        )
    );
CREATE POLICY "Sender can edit or delete message" ON public.messages
    FOR UPDATE TO authenticated
    USING (auth.uid() = sender_id);

-- MESSAGE MEDIA
CREATE POLICY "Chat members view media" ON public.message_media
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            JOIN public.chat_members cm ON cm.chat_id = m.chat_id
            WHERE m.id = message_media.message_id
            AND cm.user_id = auth.uid()
        )
    );
CREATE POLICY "Senders attach media" ON public.message_media
    FOR INSERT TO authenticated WITH CHECK (true);

-- MESSAGE RECEIPTS
CREATE POLICY "Members view receipts" ON public.message_receipts
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users upsert own receipt" ON public.message_receipts
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- MESSAGE REACTIONS
CREATE POLICY "Members view reactions" ON public.message_reactions
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own reactions" ON public.message_reactions
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- STARRED MESSAGES
CREATE POLICY "Users manage starred messages" ON public.starred_messages
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- PINNED MESSAGES
CREATE POLICY "Members view pinned messages" ON public.pinned_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = pinned_messages.chat_id
            AND chat_members.user_id = auth.uid()
        )
    );
CREATE POLICY "Members or admins pin messages" ON public.pinned_messages
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = pinned_messages.chat_id
            AND chat_members.user_id = auth.uid()
        )
    );

-- POLLS & VOTES
CREATE POLICY "Members view polls" ON public.polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members create polls" ON public.polls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Members view poll options" ON public.poll_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members create poll options" ON public.poll_options FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Members view poll votes" ON public.poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users cast own votes" ON public.poll_votes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- STICKERS
CREATE POLICY "Everyone views stickers" ON public.sticker_packs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone views pack stickers" ON public.stickers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage installed packs" ON public.user_sticker_packs FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage recent stickers" ON public.recent_stickers FOR ALL TO authenticated USING (auth.uid() = user_id);

-- STATUS
CREATE POLICY "Users view non-expired status" ON public.status
    FOR SELECT TO authenticated
    USING (expires_at > NOW());
CREATE POLICY "Users manage own status" ON public.status
    FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users track views on status" ON public.status_views
    FOR ALL TO authenticated USING (auth.uid() = viewer_id OR auth.uid() = (SELECT user_id FROM public.status WHERE id = status_id));

-- CALLS
CREATE POLICY "Users view calls they participate in" ON public.calls
    FOR SELECT TO authenticated
    USING (
        caller_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.call_participants
            WHERE call_participants.call_id = calls.id
            AND call_participants.user_id = auth.uid()
        )
    );
CREATE POLICY "Users initiate calls" ON public.calls
    FOR INSERT TO authenticated WITH CHECK (caller_id = auth.uid());
CREATE POLICY "Users update calls" ON public.calls
    FOR UPDATE TO authenticated USING (caller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.call_participants WHERE call_participants.call_id = calls.id AND call_participants.user_id = auth.uid()
    ));

-- CALL PARTICIPANTS
CREATE POLICY "Participants view call participants" ON public.call_participants
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage call participants" ON public.call_participants
    FOR ALL TO authenticated USING (true);

-- NOTIFICATIONS
CREATE POLICY "Users view and manage own notifications" ON public.notifications
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- REPORTS
CREATE POLICY "Users create reports" ON public.reported_users
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins view reports" ON public.reported_users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
        )
    );

-- STORAGE BUCKETS (Execute via Supabase SQL)
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('stickers', 'stickers', true),
('chat-media', 'chat-media', false),
('voice-messages', 'voice-messages', false),
('documents', 'documents', false),
('status-media', 'status-media', false)
ON CONFLICT (id) DO NOTHING;
