# 404 Founders — API & Service Layer Reference

## Overview
All client-to-backend operations are structured through modular TypeScript service layers and secure Next.js App Router Route Handlers.

---

## 1. Next.js Route Handlers (`/app/api`)

### `POST /api/auth/turnstile`
Validates Cloudflare Turnstile bot verification challenges server-side.
- **Request Body**:
  ```json
  {
    "token": "0.cf-turnstile-token-here"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Turnstile challenge verified"
  }
  ```

### `GET /auth/callback`
OAuth callback endpoint that exchanges the code returned from Supabase Auth (e.g., Google OAuth) for an authenticated user session and redirects to `/chat`.

---

## 2. Client Service Modules

### `authService`
- `signup({ fullName, username, email, password, turnstileToken })`
- `login({ email, password, turnstileToken })`
- `loginWithGoogle()`
- `forgotPassword(email, turnstileToken)`
- `resendVerificationEmail(email)`
- `logout()`
- `getCurrentProfile()`

### `chatService`
- `getChats(userId)`: Returns chats with unread badges, pins, and member previews.
- `createDirectChat(currentUserId, targetUserId)`
- `createGroupChat(currentUserId, { name, description, photoUrl, memberIds })`
- `updateGroupInfo(chatId, info)`
- `addMemberToGroup(chatId, userId, role)`
- `removeMemberFromGroup(chatId, userId)`
- `muteChat(chatId, userId, muteUntil)`
- `archiveChat(chatId, userId, isArchived)`
- `pinChat(chatId, userId, isPinned)`
- `generateInviteLink(chatId, userId)`
- `joinGroupByInviteCode(code, userId)`

### `messageService`
- `getMessages(chatId, limit, beforeDate)`
- `sendMessage({ chatId, senderId, text, messageType, replyToMessageId, media, poll, location, contact })`
- `editMessage(messageId, senderId, newText)`
- `deleteForEveryone(messageId, senderId)`
- `deleteForMe(messageId, userId)`
- `reactToMessage(messageId, userId, emoji)`
- `removeReaction(messageId, userId, emoji)`
- `starMessage(messageId, userId, isStarred)`
- `pinMessage(chatId, messageId, pinnedBy, isPinned)`
- `markMessageDelivered(messageId, userId)`
- `markMessageRead(messageId, userId)`
- `castPollVote(pollId, optionId, userId)`
- `searchMessages(query, chatId)`

### `callService`
- `createCall(callerId, calleeId, callType, chatId)`
- `acceptCall(callId, userId)`
- `rejectCall(callId, userId)`
- `endCall(callId, durationSeconds)`
- `getCallHistory(userId)`

### `storageService`
- `validateFile(file, category)`: Enforces size limits (Image 10MB, Video 50MB, Document 25MB, Voice 10MB).
- `uploadAvatar(file, userId)`
- `uploadChatMedia(file, chatId, category)`

### `emailService`
- `sendVerificationEmail(to, userName, token)`
- `sendWelcomeEmail(to, userName)`
- `sendPasswordResetEmail(to, userName, token)`
- `sendSecurityEmail(to, userName, ip, ua)`
- `sendNewMessageEmail(to, recipient, sender, chatTitle, snippet, chatId)`
- `sendGroupInviteEmail(to, recipient, inviter, groupName, inviteCode)`
- `sendAddedToGroupEmail(to, recipient, adder, groupName, chatId)`
- `sendRemovedFromGroupEmail(to, recipient, groupName)`
- `sendMentionEmail(to, recipient, sender, groupName, snippet, chatId)`
- `sendMissedCallEmail(to, recipient, caller, callType, chatId)`
- `sendAccountEmailChanged(to, userName, oldEmail, newEmail)`
- `sendAccountDeletionEmail(to, userName)`
