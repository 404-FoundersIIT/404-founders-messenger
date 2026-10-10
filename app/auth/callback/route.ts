import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('OAuth callback error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError.message);
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=SessionExchangeFailed`);
    }

    const authUser = sessionData?.user;
    if (authUser && authUser.email) {
      const email = authUser.email.toLowerCase().trim();
      const fullName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        email.split('@')[0];
      const avatarUrl =
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        null;
      const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '_');

      // Check if user exists in public.profiles
      const { rows } = await query(
        `SELECT * FROM public.profiles WHERE LOWER(email) = $1 OR id = $2 LIMIT 1`,
        [email, authUser.id]
      );

      let profile;
      if (rows.length > 0) {
        profile = rows[0];
        if (avatarUrl && !profile.avatar_url) {
          await query(`UPDATE public.profiles SET avatar_url = $1 WHERE id = $2`, [avatarUrl, profile.id]);
          profile.avatar_url = avatarUrl;
        }
      } else {
        const insertRes = await query(
          `INSERT INTO public.profiles (id, full_name, username, email, avatar_url, is_verified, bio, status_text)
           VALUES ($1, $2, $3, $4, $5, true, 'Hey there! I am using 404 Founders.', 'Available')
           RETURNING *`,
          [authUser.id, fullName, username, email, avatarUrl]
        );
        profile = insertRes.rows[0];
      }

      const redirectSuccess = new URL('/auth/google-callback', requestUrl.origin);
      redirectSuccess.searchParams.set('user', JSON.stringify(profile));
      return NextResponse.redirect(redirectSuccess);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/chat`);
}
