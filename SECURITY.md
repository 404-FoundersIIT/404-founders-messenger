# 404 Founders — Security & Privacy Architecture

## Overview
Security in **404 Founders** is built with Defense in Depth:
1. **Database level**: PostgreSQL Row Level Security (RLS).
2. **Network/Edge level**: Cloudflare Turnstile anti-bot challenge.
3. **Application level**: Next.js App Router Server Route Handlers and validation rules.
4. **Credential level**: Strict separation of client anon keys and server-only secrets.

---

## 1. Secrets Management
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Safe for client execution; restricted by PostgreSQL RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only (`lib/supabase/admin.ts`). **Never bundled in client code**.
- `TURNSTILE_SECRET_KEY`: Server-only (`app/api/auth/turnstile/route.ts`).
- `SMTP_PASSWORD`: Server-only (`lib/email/mailer.ts`).
- `GOOGLE_CLIENT_SECRET`: Configured strictly inside Supabase Auth dashboard.

---

## 2. Row Level Security (RLS) Enforcement

### Chat Isolation
Every query to `chats` or `messages` verifies that the requesting user (`auth.uid()`) is an active member in `chat_members`:
```sql
CREATE POLICY "Users view messages in their chats" ON public.messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_members
            WHERE chat_members.chat_id = messages.chat_id
            AND chat_members.user_id = auth.uid()
        )
    );
```

### Sender Spoofing Prevention
A user cannot send a message on behalf of someone else:
```sql
CREATE POLICY "Send message only as oneself" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);
```

---

## 3. Bot Protection via Cloudflare Turnstile
All public entry points (Signup, Login, Password Reset) are protected with Turnstile.
Client scripts receive an ephemeral challenge token verified by the backend Route Handler (`POST /api/auth/turnstile`) directly against Cloudflare's `siteverify` endpoint before Supabase Auth operations proceed.

---

## 4. File Upload & Storage Security
1. **Size Limits**:
   - Images: 10 MB
   - Videos: 50 MB
   - Documents: 25 MB
   - Voice Notes: 10 MB
2. **MIME Verification**:
   - Files are validated client-side and in storage upload handlers. Executables (`.exe`, `.bat`, `.sh`, `.msi`) are rejected.
3. **Bucket Permissions**:
   - `avatars` and `stickers`: Publicly readable.
   - `chat-media`, `voice-messages`, `documents`, and `status-media`: Restricted to authenticated members of the associated chat.
