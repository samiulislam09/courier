import { NextRequest, NextResponse } from 'next/server';
import { extractCourierData } from '@/lib/openai';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { rawText } = body;

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'Raw text is required' },
        { status: 400 }
      );
    }

    if (rawText.length > 5000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum 5000 characters.' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const extracted = await extractCourierData(rawText);

    return NextResponse.json(extracted, { status: 200 });
  } catch (error) {
    console.error('AI extraction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract data' },
      { status: 500 }
    );
  }
}
