import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'User ID or Email is required' }, { status: 400 });
    }

    const cleanInput = identifier.toString().toLowerCase().trim();

    // 1. Find profile by username or email
    const userRes = await query(`
      SELECT * FROM public.profiles
      WHERE LOWER(username) = $1 OR LOWER(email) = $1
      LIMIT 1
    `, [cleanInput]);

    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found. Please check your username/email or sign up.' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // 2. Check password if password_hash exists
    if (user.password_hash && password && user.password_hash !== password) {
      return NextResponse.json({ success: false, error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user,
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Login failed' }, { status: 500 });
  }
}
