import { NextRequest, NextResponse } from 'next/server';

const STEADFAST_API_URL = 'https://portal.packzy.com/api/v1';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { phone, apiKey, secretKey } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'Steadfast credentials are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${STEADFAST_API_URL}/fraud_check/${phone}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Steadfast data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Steadfast fraud check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
