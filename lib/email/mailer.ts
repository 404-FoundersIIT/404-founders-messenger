import nodemailer from 'nodemailer';

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendMailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'kasoltripmandi@gmail.com';
  const pass = process.env.SMTP_PASSWORD || 'ergfubnhulqoeivu';
  const from = process.env.SMTP_FROM || 'kasoltripmandi@gmail.com';
  const fromName = process.env.SMTP_FROM_NAME || '404 Founders Messenger';

  // If credentials are empty or placeholder in local demo, log safely and don't crash
  if (!pass || pass.includes('placeholder')) {
    console.info(`[Email Service - Dev Mode] Simulated sending to: ${to} | Subject: "${subject}"`);
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown SMTP error';
    console.error('[Email Service] Failed to send email:', errMessage);
    return { success: false, error: errMessage };
  }
}
