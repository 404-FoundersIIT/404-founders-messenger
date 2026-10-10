import { sendEmail } from '@/lib/email/mailer';
import {
  verifyEmailTemplate,
  welcomeEmailTemplate,
  passwordResetTemplate,
  securityAlertTemplate,
  newMessageTemplate,
  groupInvitationTemplate,
  addedToGroupTemplate,
  removedFromGroupTemplate,
  mentionNotificationTemplate,
  missedCallTemplate,
  accountEmailChangedTemplate,
  accountDeletionTemplate,
} from '@/lib/email/templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const emailService = {
  async sendVerificationEmail(to: string, userName: string, token: string) {
    const verifyUrl = `${APP_URL}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;
    const { subject, html } = verifyEmailTemplate(userName, verifyUrl);
    return sendEmail({ to, subject, html });
  },

  async sendWelcomeEmail(to: string, userName: string) {
    const { subject, html } = welcomeEmailTemplate(userName, `${APP_URL}/chat`);
    return sendEmail({ to, subject, html });
  },

  async sendPasswordResetEmail(to: string, userName: string, token: string) {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;
    const { subject, html } = passwordResetTemplate(userName, resetUrl);
    return sendEmail({ to, subject, html });
  },

  async sendSecurityEmail(to: string, userName: string, ipAddress: string, userAgent: string) {
    const timeString = new Date().toLocaleString();
    const { subject, html } = securityAlertTemplate(userName, ipAddress, userAgent, timeString);
    return sendEmail({ to, subject, html });
  },

  async sendNewMessageEmail(to: string, recipientName: string, senderName: string, chatTitle: string, snippet: string, chatId: string) {
    const chatUrl = `${APP_URL}/chat/${chatId}`;
    const { subject, html } = newMessageTemplate(recipientName, senderName, chatTitle, snippet, chatUrl);
    return sendEmail({ to, subject, html });
  },

  async sendGroupInviteEmail(to: string, recipientName: string, inviterName: string, groupName: string, inviteCode: string) {
    const inviteUrl = `${APP_URL}/join/${inviteCode}`;
    const { subject, html } = groupInvitationTemplate(recipientName, inviterName, groupName, inviteUrl);
    return sendEmail({ to, subject, html });
  },

  async sendAddedToGroupEmail(to: string, recipientName: string, adderName: string, groupName: string, chatId: string) {
    const groupUrl = `${APP_URL}/chat/${chatId}`;
    const { subject, html } = addedToGroupTemplate(recipientName, adderName, groupName, groupUrl);
    return sendEmail({ to, subject, html });
  },

  async sendRemovedFromGroupEmail(to: string, recipientName: string, groupName: string) {
    const { subject, html } = removedFromGroupTemplate(recipientName, groupName);
    return sendEmail({ to, subject, html });
  },

  async sendMentionEmail(to: string, recipientName: string, senderName: string, groupName: string, snippet: string, chatId: string) {
    const chatUrl = `${APP_URL}/chat/${chatId}`;
    const { subject, html } = mentionNotificationTemplate(recipientName, senderName, groupName, snippet, chatUrl);
    return sendEmail({ to, subject, html });
  },

  async sendMissedCallEmail(to: string, recipientName: string, callerName: string, callType: 'audio' | 'video', chatId: string) {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const chatUrl = `${APP_URL}/chat/${chatId}`;
    const { subject, html } = missedCallTemplate(recipientName, callerName, callType, timeString, chatUrl);
    return sendEmail({ to, subject, html });
  },

  async sendAccountEmailChanged(to: string, userName: string, oldEmail: string, newEmail: string) {
    const { subject, html } = accountEmailChangedTemplate(userName, oldEmail, newEmail);
    return sendEmail({ to, subject, html });
  },

  async sendAccountDeletionEmail(to: string, userName: string) {
    const { subject, html } = accountDeletionTemplate(userName);
    return sendEmail({ to, subject, html });
  },
};
