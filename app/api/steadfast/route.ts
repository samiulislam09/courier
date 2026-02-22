import { NextRequest, NextResponse } from 'next/server';
import { createParcel } from '@/lib/steadfast';
import type { SteadfastApiRequest } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SteadfastApiRequest = await request.json();

    const { credentials, courierData } = body;

    // Validate required fields
    if (!credentials?.apiKey || !credentials?.secretKey) {
      return NextResponse.json(
        { error: 'API credentials are required' },
        { status: 400 }
      );
    }

    if (!courierData?.recipient_name || !courierData?.recipient_phone || !courierData?.recipient_address) {
      return NextResponse.json(
        { error: 'Recipient name, phone, and address are required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phone = courierData.recipient_phone.replace(/\D/g, '');
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid Bangladesh phone number format' },
        { status: 400 }
      );
    }

    // Call Steadfast API
    const result = await createParcel(credentials, {
      ...courierData,
      recipient_phone: phone,
    });

    // Handle Steadfast API responses
    if (result.status === 200) {
      return NextResponse.json(result, { status: 200 });
    }

    // Handle error response from Steadfast
    return NextResponse.json(
      { 
        error: result.message || 'Failed to create parcel',
        errors: result.errors,
        status: result.status
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Steadfast API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
