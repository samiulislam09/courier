'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, ConfirmModal, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  filterEntries,
  exportToCSV,
  downloadFile,
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
  cn,
} from '@/utils';
import type { ReportFilters, CourierStatus, CourierEntry } from '@/types';

const statusOptions: { value: CourierStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
];

export default function ReportPage() {
  const { showToast } = useToast();
  const entries = useAppStore((state) => state.entries);
  const deleteEntry = useAppStore((state) => state.deleteEntry);

  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    searchTerm: '',
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CourierEntry | null>(null);

  const filteredEntries = useMemo(
    () => filterEntries(entries, filters),
    [entries, filters]
  );

  const totalCOD = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + e.cod_amount, 0),
    [filteredEntries]
  );

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    const csv = exportToCSV(filteredEntries);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, `courier-report-${date}.csv`, 'text/csv');
    showToast('Report exported successfully', 'success');
  };

  const handleDelete = (id: string) => {
    setEntryToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete);
      showToast('Entry deleted', 'success');
      setEntryToDelete(null);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: 'all',
      searchTerm: '',
    });
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report</h1>
          <p className="text-gray-600 mt-1">View and export your courier entries</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              type="date"
              label="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
            <Input
              type="date"
              label="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Search"
              placeholder="Name, phone, invoice..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
            <div className="flex items-end">
              <Button variant="ghost" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Total Entries</p>
            <p className="text-2xl font-bold text-gray-900">{filteredEntries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Total COD</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCOD)}</p>
          </CardContent>
        </Card>
        
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  COD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No entries found
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.invoice}
                      </span>
                      {entry.tracking_code && (
                        <p className="text-xs text-gray-500">{entry.tracking_code}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{entry.recipient_name}</span>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {entry.recipient_address}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.recipient_phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(entry.cod_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-4">
                        {entry.tracking_code && (
                          <a
                            href={`https://steadfast.com.bd/t/${entry.tracking_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Track Order
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Entry Details Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Entry Details"
        className="max-w-lg"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Invoice</p>
                <p className="text-sm font-medium text-gray-900">{selectedEntry.invoice}</p>
              </div>
              {selectedEntry.tracking_code && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Tracking Code</p>
                  <p className="text-sm font-medium text-gray-900">{selectedEntry.tracking_code}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recipient</p>
              <p className="text-sm font-medium text-gray-900">{selectedEntry.recipient_name}</p>
              <p className="text-sm text-gray-600">{selectedEntry.recipient_phone}</p>
              <p className="text-sm text-gray-600 mt-1">{selectedEntry.recipient_address}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">COD Amount</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedEntry.cod_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <span
                  className={cn(
                    'inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1',
                    getStatusColor(selectedEntry.status)
                  )}
                >
                  {getStatusLabel(selectedEntry.status)}
                </span>
              </div>
            </div>

            {selectedEntry.note && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Note</p>
                <p className="text-sm text-gray-600">{selectedEntry.note}</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
              <p className="text-sm text-gray-600">{formatDate(selectedEntry.created_at)}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selectedEntry.tracking_code && (
                <a
                  href={`https://steadfast.com.bd/t/${selectedEntry.tracking_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    Track Order
                  </Button>
                </a>
              )}
              <Button
                variant="danger"
                onClick={() => {
                  setSelectedEntry(null);
                  handleDelete(selectedEntry.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
