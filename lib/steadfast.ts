import type { SteadfastCredentials, SteadfastCourierData, SteadfastApiResponse } from '@/types';

const STEADFAST_API_BASE = 'https://portal.packzy.com/api/v1';

/**
 * Create a new parcel order with Steadfast Courier
 */
export async function createParcel(
  credentials: SteadfastCredentials,
  courierData: SteadfastCourierData
): Promise<SteadfastApiResponse> {
  const url = `${STEADFAST_API_BASE}/create_order`;
  
  console.log('Creating parcel at:', url);
  console.log('Parcel data:', JSON.stringify(courierData, null, 2));
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': credentials.apiKey,
      'Secret-Key': credentials.secretKey,
    },
    body: JSON.stringify({
      invoice: courierData.invoice,
      recipient_name: courierData.recipient_name,
      recipient_phone: courierData.recipient_phone,
      recipient_address: courierData.recipient_address,
      cod_amount: courierData.cod_amount,
      note: courierData.note,
    }),
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Steadfast API returned non-JSON response:', text.substring(0, 500));
    
    // Provide more helpful error messages based on status
    if (response.status === 500) {
      throw new Error('Steadfast server error. This could be due to: 1) Duplicate invoice ID 2) Server maintenance. Try with a different invoice.');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid API credentials. Please check your Api-Key and Secret-Key.');
    }
    if (response.status === 404) {
      throw new Error('Steadfast API endpoint not found. The API may have changed.');
    }
    throw new Error(`Steadfast API error (HTTP ${response.status}): Server returned an invalid response`);
  }

  const data = await response.json();
  return data as SteadfastApiResponse;
}

/**
 * Get parcel status by consignment ID
 */
export async function getParcelStatus(
  credentials: SteadfastCredentials,
  consignmentId: string
): Promise<SteadfastApiResponse> {
  const response = await fetch(
    `${STEADFAST_API_BASE}/status_by_cid/${consignmentId}`,
    {
      method: 'GET',
      headers: {
        'Api-Key': credentials.apiKey,
        'Secret-Key': credentials.secretKey,
      },
    }
  );

  const data = await response.json();
  return data as SteadfastApiResponse;
}

/**
 * Get parcel status by invoice number
 */
export async function getParcelStatusByInvoice(
  credentials: SteadfastCredentials,
  invoice: string
): Promise<SteadfastApiResponse> {
  const response = await fetch(
    `${STEADFAST_API_BASE}/status_by_invoice/${invoice}`,
    {
      method: 'GET',
      headers: {
        'Api-Key': credentials.apiKey,
        'Secret-Key': credentials.secretKey,
      },
    }
  );

  const data = await response.json();
  return data as SteadfastApiResponse;
}

/**
 * Get current balance
 */
export async function getBalance(
  credentials: SteadfastCredentials
): Promise<{ current_balance: number; status: number }> {
  const response = await fetch(`${STEADFAST_API_BASE}/get_balance`, {
    method: 'GET',
    headers: {
      'Api-Key': credentials.apiKey,
      'Secret-Key': credentials.secretKey,
    },
  });

  const data = await response.json();
  return data;
}

/**
 * Validate credentials by checking balance
 */
export async function validateCredentials(
  credentials: SteadfastCredentials
): Promise<{ valid: boolean; message?: string; balance?: number }> {
  try {
    const response = await fetch(`${STEADFAST_API_BASE}/get_balance`, {
      method: 'GET',
      headers: {
        'Api-Key': credentials.apiKey,
        'Secret-Key': credentials.secretKey,
        'Content-Type': 'application/json',
      },
    });

    // Log HTTP response for debugging
    console.log('Steadfast API HTTP Status:', response.status);

    // Check HTTP status first
    if (response.status === 401 || response.status === 403) {
      return { 
        valid: false, 
        message: 'Invalid API credentials. Please check your Api-Key and Secret-Key.' 
      };
    }

    if (!response.ok && response.status !== 200) {
      return { 
        valid: false, 
        message: `Steadfast API returned error: HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    
    // Log for debugging (will show in server console)
    console.log('Steadfast validation response:', JSON.stringify(data));
    
    // Check various success indicators
    // Response format: { "status": 200, "current_balance": 0 }
    if (data.status === 200 || data.current_balance !== undefined) {
      return { 
        valid: true,
        balance: data.current_balance 
      };
    }
    
    // Handle error responses
    const errorMsg = data.message || data.error || data.errors;
    if (errorMsg) {
      return { valid: false, message: String(errorMsg) };
    }
    
    return { 
      valid: false, 
      message: 'Unexpected API response. Please verify your credentials.'
    };
  } catch (error) {
    console.error('Steadfast validation error:', error);
    return { 
      valid: false, 
      message: 'Could not connect to Steadfast API. Please check your internet connection.' 
    };
  }
}
