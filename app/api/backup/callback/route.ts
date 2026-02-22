import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/drive';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${error}`, baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_code', baseUrl)
      );
    }

    const tokens = await exchangeCodeForTokens(code);

    // Create a response that will set the tokens in localStorage via a page
    // We need to pass tokens through the URL (encoded) and let client-side JS save them
    const tokenData = encodeURIComponent(JSON.stringify(tokens));

    return NextResponse.redirect(
      new URL(`/api/backup/callback/success?tokens=${tokenData}`, baseUrl)
    );
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=token_exchange_failed', baseUrl)
    );
  }
}
