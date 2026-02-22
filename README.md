# Courier Manager

A production-ready Next.js 16 courier management application with Steadfast Courier API integration, AI-powered data extraction, and Google Drive backup support. All data is stored in browser localStorage - no database required.

## Features

- **Steadfast Courier Integration** - Create and manage parcel orders
- **AI-Powered Data Extraction** - Extract courier data from raw text using OpenAI
- **MCP Server** - Model Context Protocol server for AI extraction
- **Google Drive Backup** - Backup and restore data to/from Google Drive
- **Local Storage** - All data stored in browser, no database needed
- **Modern UI** - Clean, responsive design with Tailwind CSS
- **TypeScript** - Full type safety throughout

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management with localStorage sync)
- OpenAI SDK (server-side)
- Google Drive REST API
- MCP SDK

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd courier
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
# Required for AI extraction
OPENAI_API_KEY=your_openai_api_key

# Optional for Google Drive backup
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Project Structure

```
/app
  /setup              # Initial credential setup
  /dashboard
    /entry            # Courier entry (AI + Manual)
    /report           # View and export entries
    /settings         # Credentials, backup, data management
  /api
    /steadfast        # Steadfast API proxy
    /ai-extract       # AI extraction endpoint
    /backup           # Google Drive backup

/components
  /ui                 # Reusable UI components

/lib
  openai.ts           # OpenAI integration
  steadfast.ts        # Steadfast API client
  drive.ts            # Google Drive integration
  storage.ts          # LocalStorage utilities
  store.ts            # Zustand store

/mcp-server
  server.ts           # MCP server for AI extraction

/types                # TypeScript type definitions
/utils                # Utility functions
```

## Usage

### Setup

1. On first visit, you'll be redirected to `/setup`
2. Enter your Steadfast API credentials
3. Credentials are saved to localStorage

### Creating Parcels

**AI Entry:**
1. Paste raw order text (e.g., from messages, emails)
2. Click "Extract with AI"
3. Review and edit extracted data
4. Submit to create parcel

**Manual Entry:**
1. Fill in the form manually
2. Submit to create parcel

### Reports

- View all courier entries
- Filter by date, status, or search term
- Export to CSV

### Backup

- **Local Backup:** Download JSON file
- **Google Drive:** Connect and backup to cloud
- **Restore:** Upload JSON file to restore entries

## MCP Server

The project includes an MCP (Model Context Protocol) server for AI extraction.

### Running the MCP Server

```bash
npm run mcp-server
```

### MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "courier-extract": {
      "command": "npx",
      "args": ["ts-node", "mcp-server/server.ts"],
      "env": {
        "OPENAI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Available Tools

- `extract_courier_data` - Extracts structured courier data from raw text

## API Routes

### POST /api/steadfast
Creates a new parcel order with Steadfast.

### POST /api/steadfast/validate
Validates Steadfast API credentials.

### POST /api/ai-extract
Extracts courier data from raw text using AI.

### POST /api/backup
Uploads backup to Google Drive.

### GET /api/backup/auth
Initiates Google OAuth flow.

## Data Storage

All data is stored in browser localStorage:

- `courier-app-storage` - Zustand persist store containing:
  - `credentials` - Steadfast API credentials
  - `entries` - Courier entries array
  - `googleTokens` - Google Drive OAuth tokens

## Security Notes

- OpenAI API key is server-side only
- Steadfast credentials are stored locally (not exposed to logs)
- All inputs are validated
- Google Drive uses OAuth 2.0

## License

MIT
