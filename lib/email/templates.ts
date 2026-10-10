// ========================================================
// 404 FOUNDERS - PROFESSIONAL HTML EMAIL TEMPLATES
// Clean, human-designed, responsive, table-based layouts
// ========================================================

interface EmailLayoutOptions {
  title: string;
  previewText: string;
  contentHtml: string;
  callToAction?: {
    text: string;
    url: string;
  };
}

function baseLayout({ title, previewText, contentHtml, callToAction }: EmailLayoutOptions): string {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; }
    .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
    .header { background-color: #00a884; padding: 24px 32px; text-align: left; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
    .header span { color: #d1fae5; font-size: 13px; display: block; margin-top: 4px; }
    .content { padding: 32px; line-height: 1.6; font-size: 15px; color: #374151; }
    .button-container { margin: 28px 0; }
    .btn { display: inline-block; background-color: #00a884; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; text-align: center; }
    .info-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 14px; }
    .footer { padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <h1>404 Founders</h1>
            <span>Real-time Secure Messenger</span>
          </div>
          <div class="content">
            ${contentHtml}
            ${callToAction ? `
              <div class="button-container">
                <a href="${callToAction.url}" class="btn" target="_blank">${callToAction.text}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0;">This email was sent by 404 Founders Messenger.</p>
            <p style="margin: 0;">&copy; ${currentYear} 404 Founders Project. All rights reserved.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// 0. VERIFY OTP CODE EMAIL
export function otpEmailTemplate(
  userName: string,
  otp: string,
  appUrl: string = 'https://404-founders-messenger.vercel.app',
  userEmail: string = ''
) {
  const verifyUrl = userEmail
    ? `${appUrl}/auth/verify?email=${encodeURIComponent(userEmail)}&otp=${encodeURIComponent(otp)}`
    : `${appUrl}/auth/verify?otp=${encodeURIComponent(otp)}`;

  return {
    subject: `404 Founders Messenger - Verification Code: ${otp}`,
    html: baseLayout({
      title: 'Verify Your Email Address',
      previewText: `Your 404 Founders verification code is ${otp}`,
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Welcome, ${userName}!</h2>
        <p>Thank you for registering on <strong>404 Founders Messenger</strong>. Please use the following 6-digit verification code to activate your account:</p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #00a884; background: #e8f7f0; padding: 18px 36px; border-radius: 12px; border: 2px dashed #00a884; font-family: monospace;">
            ${otp}
          </div>
        </div>
        <p style="font-size: 13px; color: #6b7280; text-align: center;">You can also verify instantly by clicking the button below:</p>
      `,
      callToAction: {
        text: 'Verify Account with 1-Click',
        url: verifyUrl,
      },
    }),
  };
}

// 1. VERIFY EMAIL
export function verifyEmailTemplate(userName: string, verifyUrl: string) {
  return {
    subject: 'Verify your 404 Founders email address',
    html: baseLayout({
      title: 'Verify your email',
      previewText: 'Confirm your email address to access 404 Founders Messenger.',
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Welcome, ${userName}!</h2>
        <p>Thank you for signing up for 404 Founders Messenger. To complete your registration and activate real-time chats, please verify your email address by clicking the button below:</p>
      `,
      callToAction: {
        text: 'Verify Email Address',
        url: verifyUrl,
      },
    }),
  };
}

// 2. WELCOME EMAIL
export function welcomeEmailTemplate(userName: string, appUrl: string) {
  return {
    subject: 'Welcome to 404 Founders Messenger',
    html: baseLayout({
      title: 'Welcome to 404 Founders',
      previewText: 'Your account is active. Connect with friends and teams.',
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Hi ${userName},</h2>
        <p>Your account is all set up and ready to use! Here are a few things you can do right away:</p>
        <ul>
          <li>Create direct 1-on-1 private conversations</li>
          <li>Set up team and study groups with custom permissions</li>
          <li>Make peer-to-peer audio and video calls via WebRTC</li>
          <li>Share documents, voice notes, stickers, and interactive polls</li>
        </ul>
      `,
      callToAction: {
        text: 'Open Messenger',
        url: appUrl,
      },
    }),
  };
}

// 3. PASSWORD RESET
export function passwordResetTemplate(userName: string, resetUrl: string) {
  return {
    subject: 'Reset your 404 Founders password',
    html: baseLayout({
      title: 'Reset Password',
      previewText: 'Reset link for your 404 Founders account.',
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Hello ${userName},</h2>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div class="info-box">
          <strong>Security notice:</strong> This link will expire in 60 minutes. If you did not make this request, you can safely ignore this email.
        </div>
      `,
      callToAction: {
        text: 'Reset Password',
        url: resetUrl,
      },
    }),
  };
}

// 4. LOGIN / SECURITY ALERT
export function securityAlertTemplate(userName: string, ipAddress: string, userAgent: string, timeString: string) {
  return {
    subject: 'Security Alert: New sign-in to your 404 Founders account',
    html: baseLayout({
      title: 'Security Alert',
      previewText: 'New device sign-in detected.',
      contentHtml: `
        <h2 style="font-size: 18px; color: #b91c1c; margin-top: 0;">New Sign-In Detected</h2>
        <p>Hi ${userName}, we noticed a new sign-in to your account with the following details:</p>
        <div class="info-box">
          <p style="margin: 4px 0;"><strong>Time:</strong> ${timeString}</p>
          <p style="margin: 4px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
          <p style="margin: 4px 0;"><strong>Device / Browser:</strong> ${userAgent}</p>
        </div>
        <p>If this was you, no action is needed. If you do not recognize this activity, please immediately reset your password.</p>
      `,
    }),
  };
}

// 5. NEW MESSAGE NOTIFICATION (OFFLINE RECIPIENT)
export function newMessageTemplate(recipientName: string, senderName: string, chatTitle: string, snippet: string, chatUrl: string) {
  return {
    subject: `New message from ${senderName}`,
    html: baseLayout({
      title: 'New Message',
      previewText: `${senderName}: ${snippet}`,
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Hi ${recipientName},</h2>
        <p>You received a new message in <strong>${chatTitle}</strong> while you were offline:</p>
        <div class="info-box" style="border-left: 4px solid #00a884;">
          <strong>${senderName}:</strong> ${snippet}
        </div>
      `,
      callToAction: {
        text: 'Reply to Message',
        url: chatUrl,
      },
    }),
  };
}

// 6. GROUP INVITATION
export function groupInvitationTemplate(recipientName: string, inviterName: string, groupName: string, inviteUrl: string) {
  return {
    subject: `${inviterName} invited you to join "${groupName}"`,
    html: baseLayout({
      title: 'Group Invitation',
      previewText: `Join group ${groupName} on 404 Founders.`,
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Group Invitation</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${inviterName}</strong> has invited you to join the group <strong>${groupName}</strong>.</p>
      `,
      callToAction: {
        text: 'Accept Invitation & Join',
        url: inviteUrl,
      },
    }),
  };
}

// 7. ADDED TO GROUP
export function addedToGroupTemplate(recipientName: string, adderName: string, groupName: string, groupUrl: string) {
  return {
    subject: `You were added to "${groupName}"`,
    html: baseLayout({
      title: 'Added to Group',
      previewText: `${adderName} added you to ${groupName}.`,
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Group Update</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${adderName}</strong> added you to the group <strong>${groupName}</strong>.</p>
      `,
      callToAction: {
        text: 'View Group Chat',
        url: groupUrl,
      },
    }),
  };
}

// 8. REMOVED FROM GROUP
export function removedFromGroupTemplate(recipientName: string, groupName: string) {
  return {
    subject: `You were removed from "${groupName}"`,
    html: baseLayout({
      title: 'Group Update',
      previewText: `You have been removed from ${groupName}.`,
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Group Notice</h2>
        <p>Hi ${recipientName},</p>
        <p>You have been removed from the group <strong>${groupName}</strong> by an administrator.</p>
      `,
    }),
  };
}

// 9. MENTION NOTIFICATION
export function mentionNotificationTemplate(recipientName: string, senderName: string, groupName: string, snippet: string, chatUrl: string) {
  return {
    subject: `${senderName} mentioned you in "${groupName}"`,
    html: baseLayout({
      title: 'New Mention',
      previewText: `${senderName} mentioned you in ${groupName}.`,
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">You Were Mentioned</h2>
        <p>Hi ${recipientName}, <strong>${senderName}</strong> mentioned you in <strong>${groupName}</strong>:</p>
        <div class="info-box" style="border-left: 4px solid #0284c7;">
          "${snippet}"
        </div>
      `,
      callToAction: {
        text: 'View Mention',
        url: chatUrl,
      },
    }),
  };
}

// 10. MISSED CALL NOTIFICATION
export function missedCallTemplate(recipientName: string, callerName: string, callType: 'audio' | 'video', timeString: string, chatUrl: string) {
  return {
    subject: `Missed ${callType} call from ${callerName}`,
    html: baseLayout({
      title: 'Missed Call',
      previewText: `You missed a ${callType} call from ${callerName}.`,
      contentHtml: `
        <h2 style="font-size: 18px; color: #dc2626; margin-top: 0;">Missed ${callType === 'video' ? 'Video' : 'Audio'} Call</h2>
        <p>Hi ${recipientName},</p>
        <p>You missed a ${callType} call from <strong>${callerName}</strong> at ${timeString}.</p>
      `,
      callToAction: {
        text: 'Call Back',
        url: chatUrl,
      },
    }),
  };
}

// 11. ACCOUNT EMAIL CHANGED
export function accountEmailChangedTemplate(userName: string, oldEmail: string, newEmail: string) {
  return {
    subject: 'Your 404 Founders email address was updated',
    html: baseLayout({
      title: 'Email Updated',
      previewText: 'Your account email address has been modified.',
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Email Address Changed</h2>
        <p>Hello ${userName},</p>
        <p>The primary email address for your 404 Founders account was changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
        <div class="info-box">
          If you did not authorize this change, please contact your administrator or secure your account immediately.
        </div>
      `,
    }),
  };
}

// 12. ACCOUNT DELETION CONFIRMATION
export function accountDeletionTemplate(userName: string) {
  return {
    subject: 'Your 404 Founders account has been closed',
    html: baseLayout({
      title: 'Account Closed',
      previewText: 'Confirmation of account deletion.',
      contentHtml: `
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Account Deletion Confirmation</h2>
        <p>Hello ${userName},</p>
        <p>This email confirms that your 404 Founders account and profile data have been permanently deleted as requested.</p>
        <p>We are sorry to see you go. If you ever wish to return, you can create a new account at any time.</p>
      `,
    }),
  };
}
