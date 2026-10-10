-- ========================================================
-- 404 FOUNDERS - COMPREHENSIVE SEED DATA
-- 10 Demo Users, 5 Private Chats, 3 Groups, 50 Messages,
-- Sample Sticker Pack, Statuses, Call History, Polls
-- ========================================================

-- Clean up existing demo data if re-running
DELETE FROM public.profiles WHERE email LIKE '%@demo.404founders.local';

-- 1. INSERT 10 DEMO PROFILES
-- IDs are fixed UUIDs for deterministic relationships
INSERT INTO public.profiles (id, full_name, username, email, bio, avatar_url, status_text, is_admin)
VALUES
('00000000-0000-0000-0000-000000000001', 'Aarav Sharma', 'aarav_sharma', 'aarav@demo.404founders.local', 'Team Lead & Backend Dev at 404 Founders', NULL, 'In a meeting', true),
('00000000-0000-0000-0000-000000000002', 'Diya Patel', 'diya_patel', 'diya@demo.404founders.local', 'Frontend Specialist & UI/UX Designer', NULL, 'Available', false),
('00000000-0000-0000-0000-000000000003', 'Rohan Gupta', 'rohan_gupta', 'rohan@demo.404founders.local', 'Database Architect & Cloud Ops', NULL, 'Working on migrations', false),
('00000000-0000-0000-0000-000000000004', 'Ananya Iyer', 'ananya_iyer', 'ananya@demo.404founders.local', 'QA Lead & Security Researcher', NULL, 'Debugging tests', false),
('00000000-0000-0000-0000-000000000005', 'Vikram Singh', 'vikram_singh', 'vikram@demo.404founders.local', 'Realtime Systems & WebRTC Dev', NULL, 'Testing calls', false),
('00000000-0000-0000-0000-000000000006', 'Sneha Nair', 'sneha_nair', 'sneha@demo.404founders.local', 'Mobile & Responsive Web Specialist', NULL, 'Busy', false),
('00000000-0000-0000-0000-000000000007', 'Kabir Verma', 'kabir_verma', 'kabir@demo.404founders.local', 'DevOps & CI/CD Enthusiast', NULL, 'At college lab', false),
('00000000-0000-0000-0000-000000000008', 'Pooja Reddy', 'pooja_reddy', 'pooja@demo.404founders.local', 'Fullstack Engineer & Technical Writer', NULL, 'Writing documentation', false),
('00000000-0000-0000-0000-000000000009', 'Aditya Joshi', 'aditya_joshi', 'aditya@demo.404founders.local', 'API Integration & Email Services', NULL, 'Available', false),
('00000000-0000-0000-0000-000000000010', 'Meera Kulkarni', 'meera_kulkarni', 'meera@demo.404founders.local', 'Project Coordinator & Presentation Lead', NULL, 'Urgent calls only', false)
ON CONFLICT (id) DO NOTHING;

-- INSERT SETTINGS & NOTIFICATION PREFERENCES FOR DEMO USERS
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.profiles WHERE email LIKE '%@demo.404founders.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles WHERE email LIKE '%@demo.404founders.local'
ON CONFLICT (user_id) DO NOTHING;

-- 2. INSERT 5 PRIVATE CHATS
INSERT INTO public.chats (id, is_group, created_by, created_at) VALUES
('10000000-0000-0000-0000-000000000001', false, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days'),
('10000000-0000-0000-0000-000000000002', false, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days'),
('10000000-0000-0000-0000-000000000003', false, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 days'),
('10000000-0000-0000-0000-000000000004', false, '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '2 days'),
('10000000-0000-0000-0000-000000000005', false, '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Private chat memberships (Pairwise)
INSERT INTO public.chat_members (chat_id, user_id, role) VALUES
-- Chat 1: Aarav & Diya
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'member'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
-- Chat 2: Aarav & Rohan
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'member'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'member'),
-- Chat 3: Diya & Sneha
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'member'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'member'),
-- Chat 4: Rohan & Vikram
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'member'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'member'),
-- Chat 5: Ananya & Pooja
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'member'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000008', 'member')
ON CONFLICT DO NOTHING;

-- 3. INSERT 3 GROUPS
INSERT INTO public.chats (id, is_group, name, description, created_by, created_at) VALUES
('20000000-0000-0000-0000-000000000001', true, '404 Founders Core Team', 'Main coordination group for college project architecture and submission.', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days'),
('20000000-0000-0000-0000-000000000002', true, 'Frontend & UI Guild', 'Tailwind CSS, design components, responsive testing, and dark mode.', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '6 days'),
('20000000-0000-0000-0000-000000000003', true, 'Project Viva Prep & Docs', 'Preparing slides, documentation, architecture diagrams, and testing scripts.', '00000000-0000-0000-0000-000000000010', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- Group permissions
INSERT INTO public.group_permissions (chat_id, who_can_edit_info, who_can_send_messages, who_can_add_members) VALUES
('20000000-0000-0000-0000-000000000001', 'admins', 'everyone', 'admins'),
('20000000-0000-0000-0000-000000000002', 'everyone', 'everyone', 'everyone'),
('20000000-0000-0000-0000-000000000003', 'admins', 'everyone', 'everyone')
ON CONFLICT (chat_id) DO NOTHING;

-- Group invite link
INSERT INTO public.group_invite_links (chat_id, code, created_by, expires_at) VALUES
('20000000-0000-0000-0000-000000000001', 'founders-core-2026', '00000000-0000-0000-0000-000000000001', NOW() + INTERVAL '30 days'),
('20000000-0000-0000-0000-000000000002', 'ui-guild-chat', '00000000-0000-0000-0000-000000000002', NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;

-- Group memberships
INSERT INTO public.chat_members (chat_id, user_id, role) VALUES
-- Group 1: All 10 members
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'admin'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'member'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'member'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'member'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'member'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'member'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008', 'member'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009', 'member'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'member'),
-- Group 2: Frontend
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'admin'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'member'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000008', 'member'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'member'),
-- Group 3: Viva & Docs
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', 'admin'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'member'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000008', 'member')
ON CONFLICT DO NOTHING;

-- 4. INSERT 50 DEMO MESSAGES
-- Messages in Group 1 (Core Team)
INSERT INTO public.messages (id, chat_id, sender_id, message_type, text, created_at) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text', 'Welcome everyone to the 404 Founders project chat! Let us synchronize on milestones today.', NOW() - INTERVAL '3 days'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'text', 'Hey Aarav! Frontend structure is set up with Next.js App Router and Tailwind CSS.', NOW() - INTERVAL '3 days' + INTERVAL '5 minutes'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'text', 'PostgreSQL schema has all normalized tables, foreign keys, and RLS policies configured.', NOW() - INTERVAL '3 days' + INTERVAL '12 minutes'),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'text', 'Turnstile bot protection and security validations passed initial audit tests.', NOW() - INTERVAL '3 days' + INTERVAL '20 minutes'),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'text', 'WebRTC signaling channel over Supabase Realtime is working for direct peer connections.', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'text', 'Mobile responsiveness tested down to 360px viewport. Bottom navigation behaves cleanly.', NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'text', 'DevOps environment variables verified for Vercel and Supabase production deploy.', NOW() - INTERVAL '2 days' + INTERVAL '4 hours'),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008', 'text', 'Documentation chapters covering RLS, WebRTC, and SMTP templates are drafted.', NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009', 'text', 'Resend SMTP integration tested. All 12 HTML email notification templates look crisp.', NOW() - INTERVAL '1 day' + INTERVAL '3 hours'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'text', 'Created a poll below to finalize our project submission demo time slot.', NOW() - INTERVAL '1 day' + INTERVAL '5 hours'),
-- Poll message
('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'poll', 'When should we do the final rehearsal before the college viva?', NOW() - INTERVAL '1 day' + INTERVAL '5 hours' + INTERVAL '1 minute'),
('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text', 'Voted! Let us also pin the project repo link and checklist.', NOW() - INTERVAL '20 hours'),
('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'text', 'Don’t forget that audio voice messages are stored in Supabase voice-messages bucket.', NOW() - INTERVAL '18 hours'),
('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'text', 'Audio and video calls tested over STUN. Latency is negligible on local network.', NOW() - INTERVAL '15 hours'),
('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'text', 'Awesome work team. WhatsApp-style UI is responsive, dark mode works seamlessly.', NOW() - INTERVAL '10 hours'),

-- Private Chat 1: Aarav & Diya (10 messages)
('30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text', 'Hi Diya, did you check the chat header icons and call button styling?', NOW() - INTERVAL '2 days'),
('30000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'text', 'Yes Aarav! Added phone and video camera icons with clean Lucide SVG glyphs.', NOW() - INTERVAL '2 days' + INTERVAL '4 minutes'),
('30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text', 'Can we also test replying to specific messages with quote previews?', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
('30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'reply', 'Replying right now! Clicking the quote banner auto-scrolls to the source message.', NOW() - INTERVAL '2 days' + INTERVAL '14 minutes'),
('30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text', 'Perfect. What about emoji reactions on hover?', NOW() - INTERVAL '1 day' + INTERVAL '8 hours'),
('30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'text', 'Done! You can tap thumbs up, heart, laugh, or pick any emoji.', NOW() - INTERVAL '1 day' + INTERVAL '8 hours' + INTERVAL '3 minutes'),
('30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text', 'And message edit / delete for me vs delete for everyone?', NOW() - INTERVAL '12 hours'),
('30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'text', 'Both supported! Delete for everyone updates the message text to "This message was deleted".', NOW() - INTERVAL '11 hours'),
('30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text', 'Great. Double checkmarks for sent (one tick), delivered (two grey ticks), and read (two blue ticks) work nicely.', NOW() - INTERVAL '5 hours'),
('30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'text', 'All receipts verify in realtime! Ready for tomorrow.', NOW() - INTERVAL '2 hours'),

-- Private Chat 2: Aarav & Rohan (8 messages)
('30000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'text', 'Rohan, did you check the composite indexes on chat_members and messages?', NOW() - INTERVAL '2 days' + INTERVAL '3 hours'),
('30000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'text', 'Yes, index on (chat_id, created_at DESC) makes pagination instant.', NOW() - INTERVAL '2 days' + INTERVAL '3 hours' + INTERVAL '10 minutes'),
('30000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'text', 'And full-text search with to_tsvector(english, text)?', NOW() - INTERVAL '1 day' + INTERVAL '6 hours'),
('30000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'text', 'GIN index is created and working. We can search messages, users, and media easily.', NOW() - INTERVAL '1 day' + INTERVAL '6 hours' + INTERVAL '15 minutes'),
('30000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'text', 'Are RLS policies verified so users cannot query other people’s chats?', NOW() - INTERVAL '14 hours'),
('30000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'text', 'Strictly isolated. Only users with valid chat_members entry can select or insert messages.', NOW() - INTERVAL '13 hours'),
('30000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'text', 'Excellent. No service role key exposed to client either.', NOW() - INTERVAL '8 hours'),
('30000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'text', 'Everything is rock solid.', NOW() - INTERVAL '6 hours'),

-- Private Chat 3: Diya & Sneha (7 messages)
('30000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'text', 'Sneha, can you verify the dark mode contrast in the message bubbles?', NOW() - INTERVAL '2 days' + INTERVAL '7 hours'),
('30000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'text', 'Checking right now. Outgoing bubble in emerald/brand-700 and incoming in slate-800 look high contrast.', NOW() - INTERVAL '2 days' + INTERVAL '7 hours' + INTERVAL '5 minutes'),
('30000000-0000-0000-0000-000000000036', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'text', 'No neon colors or excessive glassmorphism, right? The requirements are very clear on that.', NOW() - INTERVAL '1 day' + INTERVAL '12 hours'),
('30000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000006', 'text', 'Zero AI tropes. Standard WhatsApp / Telegram clean human UI pattern with crisp borders.', NOW() - INTERVAL '1 day' + INTERVAL '12 hours' + INTERVAL '4 minutes'),
('30000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'text', 'And responsive mobile drawer closes on message click.', NOW() - INTERVAL '9 hours'),
('30000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'text', 'Confirmed, smooth transition.', NOW() - INTERVAL '7 hours'),
('30000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'text', 'Awesome!', NOW() - INTERVAL '4 hours'),

-- Private Chat 4: Rohan & Vikram (5 messages)
('30000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'text', 'Vikram, STUN server configuration uses stun.l.google.com:19302, correct?', NOW() - INTERVAL '1 day' + INTERVAL '4 hours'),
('30000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'text', 'Yes! Free Google public STUN servers. No external paid TURN needed for local and campus networks.', NOW() - INTERVAL '1 day' + INTERVAL '4 hours' + INTERVAL '10 minutes'),
('30000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'text', 'And signaling uses Supabase Realtime broadcast channel.', NOW() - INTERVAL '18 hours'),
('30000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'text', 'Exactly, exchange SDP offer, answer, and ICE candidates via call channel.', NOW() - INTERVAL '16 hours'),
('30000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'text', 'Ring tone synthesis with Web Audio API avoids external audio assets.', NOW() - INTERVAL '12 hours'),

-- Private Chat 5: Ananya & Pooja (5 messages)
('30000000-0000-0000-0000-000000000046', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'text', 'Pooja, how are the test cases for message forward and reply looking?', NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
('30000000-0000-0000-0000-000000000047', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000008', 'text', 'All 24 test suites in Vitest pass without errors.', NOW() - INTERVAL '1 day' + INTERVAL '2 hours' + INTERVAL '12 minutes'),
('30000000-0000-0000-0000-000000000048', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'text', 'Did you also check the Admin Dashboard statistics route?', NOW() - INTERVAL '15 hours'),
('30000000-0000-0000-0000-000000000049', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000008', 'text', 'Yes, counts total users, active groups, messages sent, storage metrics and pending reports.', NOW() - INTERVAL '10 hours'),
('30000000-0000-0000-0000-000000000050', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'text', 'Ready for demonstration! All criteria met.', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- 5. REPLIES AND PINNED MESSAGES
UPDATE public.messages
SET reply_to_message_id = '30000000-0000-0000-0000-000000000018'
WHERE id = '30000000-0000-0000-0000-000000000019';

INSERT INTO public.pinned_messages (chat_id, message_id, pinned_by)
VALUES ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 6. REACTIONS
INSERT INTO public.message_reactions (message_id, user_id, emoji) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '🔥'),
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '👍'),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '👏'),
('30000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '❤️')
ON CONFLICT DO NOTHING;

-- 7. STARRED MESSAGES
INSERT INTO public.starred_messages (user_id, message_id) VALUES
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005'),
('00000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 8. POLL & OPTIONS & VOTES
INSERT INTO public.polls (id, message_id, question, is_multiple_choice) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011', 'When should we do the final rehearsal before the college viva?', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.poll_options (id, poll_id, option_text, sort_order) VALUES
('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Today at 6:00 PM', 1),
('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Tomorrow morning at 10:00 AM', 2),
('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'Tomorrow evening at 5:00 PM', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.poll_votes (poll_id, option_id, user_id) VALUES
('40000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
('40000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
('40000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- 9. SAMPLE STICKER PACK & STICKERS
INSERT INTO public.sticker_packs (id, name, description, author, icon_url, is_official) VALUES
('50000000-0000-0000-0000-000000000001', 'College Life & Coding', 'Essential everyday stickers for developers and students', '404 Founders', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4bb.png', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stickers (id, pack_id, image_url, emoji_tag) VALUES
('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f680.png', '🚀'),
('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4bb.png', '💻'),
('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2705.png', '✅'),
('51000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4af.png', '💯'),
('51000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001', 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2615.png', '☕')
ON CONFLICT (id) DO NOTHING;

-- 10. SAMPLE STATUSES (24h Active Stories)
INSERT INTO public.status (id, user_id, status_type, content, background_color, expires_at) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'text', 'Finalizing the submission documentation! 📚✨', '#075e54', NOW() + INTERVAL '18 hours'),
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'text', 'Frontend testing completed without any UI glitches 🚀', '#128c7e', NOW() + INTERVAL '22 hours')
ON CONFLICT (id) DO NOTHING;

-- 11. SAMPLE CALL HISTORY
INSERT INTO public.calls (id, chat_id, caller_id, call_type, is_group, status, started_at, ended_at, duration) VALUES
('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'video', false, 'connected', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '12 minutes', 720),
('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'audio', false, 'missed', NOW() - INTERVAL '6 hours', NULL, 0),
('70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'audio', true, 'connected', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours' + INTERVAL '35 minutes', 2100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.call_participants (call_id, user_id, role, status) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'caller', 'connected'),
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'callee', 'connected'),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'caller', 'connected'),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'callee', 'missed')
ON CONFLICT DO NOTHING;

-- 12. SAMPLE NOTIFICATIONS
INSERT INTO public.notifications (user_id, type, title, message, data, is_read) VALUES
('00000000-0000-0000-0000-000000000001', 'group_added', 'Added to 404 Founders Core Team', 'You are now an admin of this group.', '{"chat_id":"20000000-0000-0000-0000-000000000001"}', true),
('00000000-0000-0000-0000-000000000001', 'missed_call', 'Missed Audio Call', 'Rohan Gupta called you 6 hours ago.', '{"caller_id":"00000000-0000-0000-0000-000000000003"}', false),
('00000000-0000-0000-0000-000000000001', 'mention', 'Mentioned in Viva Prep', 'Meera mentioned you in Project Viva Prep & Docs', '{"chat_id":"20000000-0000-0000-0000-000000000003"}', false)
ON CONFLICT DO NOTHING;
