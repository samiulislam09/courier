import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/steadfast';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { apiKey, secretKey } = body;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { valid: false, message: 'API Key and Secret Key are required' },
        { status: 400 }
      );
    }

    const result = await validateCredentials({ apiKey, secretKey });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to validate credentials' },
      { status: 500 }
    );
  }
}
