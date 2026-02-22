import { NextRequest, NextResponse } from 'next/server';
import { uploadBackup, getValidAccessToken } from '@/lib/drive';
import type { GoogleDriveTokens } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { tokens, data } = body as { 
      tokens: GoogleDriveTokens; 
      data: object 
    };

    if (!tokens?.access_token || !tokens?.refresh_token) {
      return NextResponse.json(
        { error: 'Google Drive tokens are required' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Backup data is required' },
        { status: 400 }
      );
    }

    // Get valid access token (refresh if needed)
    let validTokens: GoogleDriveTokens;
    try {
      validTokens = await getValidAccessToken(tokens);
    } catch {
      return NextResponse.json(
        { error: 'token_expired', message: 'Google authentication expired' },
        { status: 401 }
      );
    }

    // Upload backup
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      ...data,
    };

    const file = await uploadBackup(validTokens.access_token, backupData);

    return NextResponse.json(
      { 
        success: true, 
        file,
        tokens: validTokens !== tokens ? validTokens : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Backup failed' },
      { status: 500 }
    );
  }
}
