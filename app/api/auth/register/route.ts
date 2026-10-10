import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { fullName, username, email, password } = await req.json();

    if (!email || !fullName || !username) {
      return NextResponse.json(
        { success: false, error: 'Full name, username, and email are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');

    // 1. Check if username is already taken by a different email
    const userCheck = await query(
      'SELECT id, email, username FROM public.profiles WHERE LOWER(username) = $1 AND LOWER(email) != $2 LIMIT 1',
      [cleanUsername, cleanEmail]
    );

    if (userCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username is already taken. Please choose another username.' },
        { status: 400 }
      );
    }

    // 2. Insert or update user profile with is_verified = true immediately (no OTP needed)
    const result = await query(
      `
      INSERT INTO public.profiles (
        full_name, username, email, password_hash, verification_otp, is_verified, bio, status_text, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, NULL, true, 'Hey there! I am using 404 Founders.', 'Available', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        is_verified = true,
        verification_otp = NULL,
        updated_at = NOW()
      RETURNING *;
      `,
      [fullName.trim(), cleanUsername, cleanEmail, password || 'password123']
    );

    const createdUser = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: createdUser,
    });
  } catch (error: any) {
    console.error('Error in instant registration:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
