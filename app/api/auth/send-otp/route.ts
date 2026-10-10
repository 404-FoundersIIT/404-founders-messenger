import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email/mailer';
import { otpEmailTemplate } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
  try {
    const { fullName, username, email, password } = await req.json();

    if (!email || !fullName || !username) {
      return NextResponse.json({ success: false, error: 'Full name, username, and email are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');

    // 1. Check if username is already taken by another user
    const userCheck = await query(
      'SELECT id, email, username FROM public.profiles WHERE LOWER(username) = $1 AND LOWER(email) != $2 LIMIT 1',
      [cleanUsername, cleanEmail]
    );

    if (userCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Username is already taken. Please choose another username.' }, { status: 400 });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Upsert user in profiles table with verification_otp and is_verified = false
    await query(`
      INSERT INTO public.profiles (full_name, username, email, password_hash, verification_otp, is_verified, bio, status_text)
      VALUES ($1, $2, $3, $4, $5, false, 'Hey there! I am using 404 Founders.', 'Available')
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        verification_otp = EXCLUDED.verification_otp,
        updated_at = NOW();
    `, [fullName.trim(), cleanUsername, cleanEmail, password || 'password123', otp]);

    // 4. Send OTP email via Google SMTP
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const { subject, html } = otpEmailTemplate(fullName.trim(), otp, appUrl, cleanEmail);
    const emailResult = await sendEmail({
      to: cleanEmail,
      subject,
      html,
    });

    console.log(`[Auth OTP] Sent code to ${cleanEmail}. Result:`, emailResult);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      // In case user is in demo mode or email has delays, also return simulated helper
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to send OTP' }, { status: 500 });
  }
}
