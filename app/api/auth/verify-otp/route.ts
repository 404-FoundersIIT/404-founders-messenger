import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and verification code are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // 1. Fetch user profile
    const userRes = await query(
      'SELECT * FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1',
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No account found with this email' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // 2. Validate OTP code (or accept if already verified or demo bypass)
    if (!user.is_verified && user.verification_otp && user.verification_otp !== cleanOtp && cleanOtp !== '123456') {
      return NextResponse.json({ success: false, error: 'Invalid verification code. Please check your email or enter 123456.' }, { status: 400 });
    }

    // 3. Mark as verified and clear OTP
    await query(`
      UPDATE public.profiles
      SET is_verified = true, verification_otp = null, updated_at = NOW()
      WHERE id = $1
    `, [user.id]);

    const updatedUser = {
      ...user,
      is_verified: true,
      verification_otp: null,
    };

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Verification failed' }, { status: 500 });
  }
}
