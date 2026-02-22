import type { CourierEntry, SteadfastCredentials, GoogleDriveTokens } from '@/types';

const STORAGE_KEYS = {
  CREDENTIALS: 'steadfast_credentials',
  ENTRIES: 'courier_entries',
  GOOGLE_TOKENS: 'google_drive_tokens',
} as const;

/**
 * Get Steadfast credentials from localStorage
 */
export function getCredentials(): SteadfastCredentials | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save Steadfast credentials to localStorage
 */
export function saveCredentials(credentials: SteadfastCredentials): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
}

/**
 * Clear Steadfast credentials from localStorage
 */
export function clearCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
}

/**
 * Get all courier entries from localStorage
 */
export function getEntries(): CourierEntry[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save courier entries to localStorage
 */
export function saveEntries(entries: CourierEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
}

/**
 * Add a single courier entry
 */
export function addEntry(entry: CourierEntry): void {
  const entries = getEntries();
  entries.unshift(entry);
  saveEntries(entries);
}

/**
 * Update a courier entry by ID
 */
export function updateEntry(id: string, updates: Partial<CourierEntry>): void {
  const entries = getEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates };
    saveEntries(entries);
  }
}

/**
 * Delete a courier entry by ID
 */
export function deleteEntry(id: string): void {
  const entries = getEntries();
  saveEntries(entries.filter((e) => e.id !== id));
}

/**
 * Clear all courier entries
 */
export function clearEntries(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ENTRIES);
}

/**
 * Get Google Drive tokens from localStorage
 */
export function getGoogleTokens(): GoogleDriveTokens | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GOOGLE_TOKENS);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save Google Drive tokens to localStorage
 */
export function saveGoogleTokens(tokens: GoogleDriveTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GOOGLE_TOKENS, JSON.stringify(tokens));
}

/**
 * Clear Google Drive tokens from localStorage
 */
export function clearGoogleTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.GOOGLE_TOKENS);
}

/**
 * Export all data for backup
 */
export function exportAllData(): object {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    credentials: getCredentials(),
    entries: getEntries(),
  };
}

/**
 * Import data from backup (entries only, not credentials)
 */
export function importEntries(entries: CourierEntry[]): void {
  const existing = getEntries();
  const existingIds = new Set(existing.map((e) => e.id));
  
  const newEntries = entries.filter((e) => !existingIds.has(e.id));
  saveEntries([...newEntries, ...existing]);
}
