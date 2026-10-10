import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    console.error('Google OAuth error or missing code:', error);
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error || 'NoCode')}`, req.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/auth/login?error=TokenExchangeFailed', req.url));
    }

    // 2. Fetch Google profile
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleProfile = await userInfoRes.json();

    if (!googleProfile.email) {
      return NextResponse.redirect(new URL('/auth/login?error=NoEmailProvided', req.url));
    }

    const cleanEmail = googleProfile.email.toLowerCase().trim();
    const cleanName = googleProfile.name || cleanEmail.split('@')[0];
    const avatarUrl = googleProfile.picture || null;
    const generatedUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_');

    // 3. Find or insert into PostgreSQL profiles
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
        [cleanName, generatedUsername, cleanEmail, avatarUrl]
      );
      user = insertRes.rows[0];
    }

    // 4. Redirect to client success page to store session in localStorage and redirect to /chat
    const redirectSuccess = new URL('/auth/google-callback', req.url);
    redirectSuccess.searchParams.set('user', JSON.stringify(user));
    return NextResponse.redirect(redirectSuccess);
  } catch (err: any) {
    console.error('Google callback error:', err);
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(err?.message || 'OAuthFailed')}`, req.url));
  }
}
