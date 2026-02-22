import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/drive';

export async function GET(): Promise<NextResponse> {
  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=auth_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  }
}
