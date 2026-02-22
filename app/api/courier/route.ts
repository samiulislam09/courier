import { NextRequest, NextResponse } from 'next/server';

const HOORIN_API_BASE_URL = 'https://dash.hoorin.com/api/courier/api';
const HOORIN_API_KEY = process.env.HOORIN_API_KEY;

interface CourierMapping {
    key: string;
    totalField: string;
    successField: string;
    cancelField: string;
}

interface CourierDetail {
    success: number;
    cancel: number;
    total: number;
}

interface CourierSuccessRateResult {
    total: {
        total: number;
        success: number;
        success_rate: number;
    };
    string: string;
    details: Record<string, CourierDetail>;
}

interface HoorinApiResponse {
    Summaries?: Record<string, Record<string, number>>;
    [key: string]: unknown;
}

function calculateCourierSuccessRate(data: HoorinApiResponse): CourierSuccessRateResult {
    const details: Record<string, CourierDetail> = {};
    let totalSuccess = 0;
    let totalCount = 0;
    const stringParts: string[] = [];

    // Map couriers from Hoorin API response (Summaries object)
    const summaries = data.Summaries || {};
    
    // Define courier mappings with their field names from Hoorin response
    const courierMappings: Record<string, CourierMapping> = {
        pathao: {
            key: 'Pathao',
            totalField: 'Total Delivery',
            successField: 'Successful Delivery',
            cancelField: 'Canceled Delivery'
        },
        steadfast: {
            key: 'Steadfast',
            totalField: 'Total Parcels',
            successField: 'Delivered Parcels',
            cancelField: 'Canceled Parcels'
        },
        redx: {
            key: 'RedX',
            totalField: 'Total Parcels',
            successField: 'Delivered Parcels',
            cancelField: 'Canceled Parcels'
        },
        carrybee: {
            key: 'Carrybee',
            totalField: 'Total Parcels',
            successField: 'Delivered Parcels',
            cancelField: 'Canceled Parcels'
        }
    };

    // First pass: calculate totals
    Object.entries(courierMappings).forEach(([courierSlug, mapping]) => {
        const courierData = summaries[mapping.key] || {};
        const success = courierData[mapping.successField] || 0;
        const cancel = courierData[mapping.cancelField] || 0;
        const total = courierData[mapping.totalField] || 0;

        details[courierSlug] = {
            success,
            cancel,
            total
        };

        totalSuccess += success;
        totalCount += total;
    });

    // Second pass: build string with calculated overall rate
    const overallSuccessRate = totalCount > 0 ? Math.round((totalSuccess / totalCount) * 100) : 0;
    stringParts.push(`total_result:${totalCount}:${totalSuccess}:${overallSuccessRate}`);

    // Add individual courier rates
    Object.entries(courierMappings).forEach(([courierSlug]) => {
        const courierDetail = details[courierSlug];
        const successRate = courierDetail.total > 0 ? Math.round((courierDetail.success / courierDetail.total) * 100) : 0;
        stringParts.push(`${courierSlug}:${courierDetail.total}:${courierDetail.success}:${successRate}`);
    });

    return {
        total: {
            total: totalCount,
            success: totalSuccess,
            success_rate: overallSuccessRate
        },
        string: stringParts.join('|'),
        details
    };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const searchTerm = searchParams.get('searchTerm');

        if (!searchTerm) {
        return NextResponse.json(
            { error: 'Search term is required' },
            { status: 400 }
        );
        }

        if (!HOORIN_API_KEY) {
            console.error('HOORIN_API_KEY is not configured');
            return NextResponse.json(
                { error: 'API configuration error' },
                { status: 500 }
            );
        }

        const response = await fetch(`${HOORIN_API_BASE_URL}?apiKey=${HOORIN_API_KEY}&searchTerm=${searchTerm}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data: HoorinApiResponse = await response.json();

        // Calculate courier success rate
        const courierSuccessRate = calculateCourierSuccessRate(data);

        const responsePayload = {
            ...data,
            courier_success_rate: courierSuccessRate
        };

        return NextResponse.json(responsePayload, { status: 200 });

    } catch (error) {
        console.error('Courier search error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}