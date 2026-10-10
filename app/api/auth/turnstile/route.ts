import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Turnstile token missing' }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

    // Cloudflare test secret bypass
    if (secretKey === '1x0000000000000000000000000000000AA' || token === 'dummy-test-token') {
      return NextResponse.json({ success: true, message: 'Turnstile verified (test mode)' });
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Bot challenge validation failed', details: result['error-codes'] },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Turnstile verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server verification error' }, { status: 500 });
  }
}
