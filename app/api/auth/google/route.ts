import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const supabaseOAuthUrl = `https://glrnweimiibhawobvoif.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
    `${origin}/auth/callback`
  )}`;

  return NextResponse.redirect(supabaseOAuthUrl);
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, avatarUrl } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Google email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name || cleanEmail.split('@')[0];
    const generatedUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_');

    // 1. Find or create profile
    let userRes = await query(
      `SELECT * FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    );

    let user;
    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
      if (avatarUrl && !user.avatar_url) {
        await query('UPDATE public.profiles SET avatar_url = $1 WHERE id = $2', [avatarUrl, user.id]);
        user.avatar_url = avatarUrl;
      }
    } else {
      const insertRes = await query(
        `INSERT INTO public.profiles (full_name, username, email, avatar_url, is_verified, bio, status_text)
         VALUES ($1, $2, $3, $4, true, 'Hey there! I am using 404 Founders.', 'Available')
         RETURNING *`,
        [cleanName, generatedUsername, cleanEmail, avatarUrl || null]
      );
      user = insertRes.rows[0];
    }

    return NextResponse.json({
      success: true,
      message: 'Google authentication successful',
      user,
    });
  } catch (error: any) {
    console.error('Error in google auth:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Google authentication failed' },
      { status: 500 }
    );
  }
}
