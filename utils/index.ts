import { v4 as uuidv4 } from 'uuid';
import type { CourierEntry, CourierStatus, ReportFilters } from '@/types';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a short invoice ID
 */
export function generateInvoiceId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${timestamp}${random}`;
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format currency (BDT)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get status badge color
 */
export function getStatusColor(status: CourierStatus): string {
  const colors: Record<CourierStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_review: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    partial_delivered: 'bg-orange-100 text-orange-800',
    cancelled: 'bg-red-100 text-red-800',
    hold: 'bg-gray-100 text-gray-800',
    unknown: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || colors.unknown;
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: CourierStatus): string {
  const labels: Record<CourierStatus, string> = {
    pending: 'Pending',
    in_review: 'In Review',
    delivered: 'Delivered',
    partial_delivered: 'Partial',
    cancelled: 'Cancelled',
    hold: 'On Hold',
    unknown: 'Unknown',
  };
  return labels[status] || 'Unknown';
}

/**
 * Validate Bangladesh phone number
 */
export function isValidBDPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^01[3-9]\d{8}$/.test(cleaned);
}

/**
 * Clean and format phone number
 */
export function cleanPhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+880')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  return cleaned;
}

/**
 * Filter entries based on filters
 */
export function filterEntries(
  entries: CourierEntry[],
  filters: ReportFilters
): CourierEntry[] {
  return entries.filter((entry) => {
    // Date filter
    if (filters.dateFrom) {
      const entryDate = new Date(entry.created_at).setHours(0, 0, 0, 0);
      const fromDate = new Date(filters.dateFrom).setHours(0, 0, 0, 0);
      if (entryDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const entryDate = new Date(entry.created_at).setHours(23, 59, 59, 999);
      const toDate = new Date(filters.dateTo).setHours(23, 59, 59, 999);
      if (entryDate > toDate) return false;
    }

    // Status filter
    if (filters.status !== 'all' && entry.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const searchFields = [
        entry.invoice,
        entry.recipient_name,
        entry.recipient_phone,
        entry.recipient_address,
        entry.note,
      ].map((f) => f?.toLowerCase() || '');
      
      if (!searchFields.some((field) => field.includes(term))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Export entries to CSV
 */
export function exportToCSV(entries: CourierEntry[]): string {
  const headers = [
    'Invoice',
    'Recipient Name',
    'Phone',
    'Address',
    'COD Amount',
    'Status',
    'Note',
    'Created At',
  ];

  const rows = entries.map((entry) => [
    entry.invoice,
    entry.recipient_name,
    entry.recipient_phone,
    `"${entry.recipient_address.replace(/"/g, '""')}"`,
    entry.cod_amount.toString(),
    entry.status,
    `"${(entry.note || '').replace(/"/g, '""')}"`,
    formatDateTime(entry.created_at),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Class name helper
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
