import OpenAI from 'openai';
import type { AIExtractResponse } from '@/types';

// Initialize OpenAI client lazily (server-side only)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not configured');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `You are a courier data extraction engine.

Extract:
- invoice
- recipient_name
- recipient_phone
- recipient_address
- cod_amount
- note

Rules:
- Phone must be valid Bangladesh format (e.g., 01XXXXXXXXX or +8801XXXXXXXXX).
- COD must be numeric only (no currency symbols).
- If invoice missing, generate a short unique id like "INV-XXXXX".
- Never hallucinate phone numbers - if not found, use empty string.
- Address should be as complete as possible.
- Return JSON only, no additional text.`;

const EXTRACTION_SCHEMA = {
  type: 'object' as const,
  properties: {
    invoice: { 
      type: 'string' as const, 
      description: 'Invoice number or order ID' 
    },
    recipient_name: { 
      type: 'string' as const, 
      description: 'Full name of the recipient' 
    },
    recipient_phone: { 
      type: 'string' as const, 
      description: 'Phone number in Bangladesh format' 
    },
    recipient_address: { 
      type: 'string' as const, 
      description: 'Complete delivery address' 
    },
    cod_amount: { 
      type: 'number' as const, 
      description: 'Cash on delivery amount (numeric only)' 
    },
    note: { 
      type: 'string' as const, 
      description: 'Additional delivery notes or instructions' 
    },
  },
  required: ['invoice', 'recipient_name', 'recipient_phone', 'recipient_address', 'cod_amount', 'note'],
  additionalProperties: false,
};

export async function extractCourierData(rawText: string): Promise<AIExtractResponse> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extract courier data from the following text:\n\n${rawText}` },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'courier_data',
          strict: true,
          schema: EXTRACTION_SCHEMA,
        },
      },
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const extracted = JSON.parse(content) as AIExtractResponse;
    
    // Validate and clean the extracted data
    return {
      invoice: extracted.invoice || generateInvoiceId(),
      recipient_name: (extracted.recipient_name || '').trim(),
      recipient_phone: cleanPhoneNumber(extracted.recipient_phone || ''),
      recipient_address: (extracted.recipient_address || '').trim(),
      cod_amount: Math.max(0, Number(extracted.cod_amount) || 0),
      note: (extracted.note || '').trim(),
    };
  } catch (error) {
    console.error('AI extraction error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to extract courier data'
    );
  }
}

function generateInvoiceId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${timestamp}${random}`;
}

function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle Bangladesh phone formats
  if (cleaned.startsWith('+880')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  // Validate Bangladesh mobile format (01XXXXXXXXX)
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  
  return cleaned;
}

export { EXTRACTION_SCHEMA, SYSTEM_PROMPT };
