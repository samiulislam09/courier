#!/usr/bin/env node
/**
 * MCP Server for Courier Data Extraction
 * 
 * This server provides AI-powered extraction of courier data from raw text
 * using OpenAI's structured output capabilities.
 * 
 * Usage:
 *   npx ts-node mcp-server/server.ts
 *   
 * Or add to MCP configuration:
 *   {
 *     "mcpServers": {
 *       "courier-extract": {
 *         "command": "npx",
 *         "args": ["ts-node", "mcp-server/server.ts"],
 *         "env": {
 *           "OPENAI_API_KEY": "your-api-key"
 *         }
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JSON Schema for courier data extraction
const COURIER_DATA_SCHEMA = {
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
      description: 'Phone number in Bangladesh format (01XXXXXXXXX)' 
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
  required: ['invoice', 'recipient_name', 'recipient_phone', 'recipient_address', 'cod_amount', 'note'] as const,
  additionalProperties: false,
};

// System prompt for extraction
const SYSTEM_PROMPT = `You are a courier data extraction engine.

Extract the following fields from the provided text:
- invoice: Invoice number or order ID
- recipient_name: Full name of the recipient
- recipient_phone: Phone number (Bangladesh format)
- recipient_address: Complete delivery address
- cod_amount: Cash on delivery amount (numeric only)
- note: Any special instructions or notes

Rules:
- Phone must be valid Bangladesh format (01XXXXXXXXX or +8801XXXXXXXXX).
- COD must be numeric only (no currency symbols or text).
- If invoice is missing, generate a short unique ID like "INV-XXXXX".
- Never hallucinate phone numbers - if not found, return empty string.
- Address should be as complete as possible.
- Return valid JSON only, no additional text or explanation.`;

// Create MCP server
const server = new Server(
  {
    name: 'courier-extract',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'extract_courier_data',
        description: 'Extract structured courier data (name, phone, address, COD amount) from raw text using AI',
        inputSchema: {
          type: 'object',
          properties: {
            raw_text: {
              type: 'string',
              description: 'Raw text containing courier/order information to extract',
            },
          },
          required: ['raw_text'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'extract_courier_data') {
    const rawText = (args as { raw_text: string }).raw_text;

    if (!rawText || typeof rawText !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'raw_text is required' }),
          },
        ],
        isError: true,
      };
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract courier data from:\n\n${rawText}` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'courier_data',
            strict: true,
            schema: COURIER_DATA_SCHEMA,
          },
        },
        temperature: 0.1,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI');
      }

      const extracted = JSON.parse(content);

      // Clean and validate the extracted data
      const cleanedData = {
        invoice: extracted.invoice || generateInvoiceId(),
        recipient_name: (extracted.recipient_name || '').trim(),
        recipient_phone: cleanPhoneNumber(extracted.recipient_phone || ''),
        recipient_address: (extracted.recipient_address || '').trim(),
        cod_amount: Math.max(0, Number(extracted.cod_amount) || 0),
        note: (extracted.note || '').trim(),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(cleanedData, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Extraction failed: ${errorMessage}` }),
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: `Unknown tool: ${name}` }),
      },
    ],
    isError: true,
  };
});

// Helper functions
function generateInvoiceId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${timestamp}${random}`;
}

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+880')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  // Validate Bangladesh mobile format
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  
  return cleaned;
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Courier Extract MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
