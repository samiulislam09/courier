// Courier Entry Types
export interface CourierEntry {
  id: string;
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note: string;
  status: CourierStatus;
  consignment_id?: string;
  tracking_code?: string;
  created_at: string;
}

export type CourierStatus = 
  | 'pending'
  | 'in_review'
  | 'delivered'
  | 'partial_delivered'
  | 'cancelled'
  | 'hold'
  | 'unknown';

// Steadfast API Types
export interface SteadfastCredentials {
  apiKey: string;
  secretKey: string;
}

export interface SteadfastCourierData {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note: string;
}

export interface SteadfastApiRequest {
  credentials: SteadfastCredentials;
  courierData: SteadfastCourierData;
}

export interface SteadfastApiResponse {
  status: number;
  message: string;
  consignment?: {
    consignment_id: number;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
  };
  errors?: Record<string, string[]>;
}

// AI Extraction Types
export interface AIExtractRequest {
  rawText: string;
}

export interface AIExtractResponse {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note: string;
}

// Google Drive Types
export interface GoogleDriveTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export interface BackupMetadata {
  id: string;
  name: string;
  createdTime: string;
  size: string;
}

// Store Types
export interface AppState {
  // Credentials
  credentials: SteadfastCredentials | null;
  setCredentials: (credentials: SteadfastCredentials) => void;
  clearCredentials: () => void;
  
  // Courier Entries
  entries: CourierEntry[];
  addEntry: (entry: CourierEntry) => void;
  updateEntry: (id: string, updates: Partial<CourierEntry>) => void;
  deleteEntry: (id: string) => void;
  clearEntries: () => void;
  
  // Google Drive
  googleTokens: GoogleDriveTokens | null;
  setGoogleTokens: (tokens: GoogleDriveTokens) => void;
  clearGoogleTokens: () => void;
  
  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// Form Types
export interface CourierFormData {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: string;
  note: string;
}

// Filter Types
export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  status: CourierStatus | 'all';
  searchTerm: string;
}
