'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { generateId, generateInvoiceId, cn } from '@/utils';
import type { CourierFormData, CourierEntry } from '@/types';

type TabType = 'ai' | 'manual';

const initialFormData: CourierFormData = {
  invoice: '',
  recipient_name: '',
  recipient_phone: '',
  recipient_address: '',
  cod_amount: '',
  note: '',
};

export default function EntryPage() {
  const { showToast } = useToast();
  const credentials = useAppStore((state) => state.credentials);
  const addEntry = useAppStore((state) => state.addEntry);

  const [activeTab, setActiveTab] = useState<TabType>('ai');
  const [rawText, setRawText] = useState('');
  const [formData, setFormData] = useState<CourierFormData>(initialFormData);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CourierFormData>>({});

  const handleInputChange = (field: keyof CourierFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CourierFormData> = {};

    if (!formData.recipient_name.trim()) {
      newErrors.recipient_name = 'Recipient name is required';
    }

    if (!formData.recipient_phone.trim()) {
      newErrors.recipient_phone = 'Phone number is required';
    } else if (!/^01[3-9]\d{8}$/.test(formData.recipient_phone.replace(/\D/g, ''))) {
      newErrors.recipient_phone = 'Invalid Bangladesh phone number';
    }

    if (!formData.recipient_address.trim()) {
      newErrors.recipient_address = 'Address is required';
    }

    if (!formData.cod_amount.trim()) {
      newErrors.cod_amount = 'COD amount is required';
    } else if (isNaN(Number(formData.cod_amount)) || Number(formData.cod_amount) < 0) {
      newErrors.cod_amount = 'Invalid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExtract = async () => {
    if (!rawText.trim()) {
      showToast('Please enter some text to extract', 'warning');
      return;
    }

    setIsExtracting(true);

    try {
      const response = await fetch('/api/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      setFormData({
        invoice: data.invoice || generateInvoiceId(),
        recipient_name: data.recipient_name || '',
        recipient_phone: data.recipient_phone || '',
        recipient_address: data.recipient_address || '',
        cod_amount: data.cod_amount?.toString() || '',
        note: data.note || '',
      });

      showToast('Data extracted successfully!', 'success');
    } catch (error) {
      console.error('Extraction error:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to extract data',
        'error'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const courierData = {
        invoice: formData.invoice || generateInvoiceId(),
        recipient_name: formData.recipient_name.trim(),
        recipient_phone: formData.recipient_phone.replace(/\D/g, ''),
        recipient_address: formData.recipient_address.trim(),
        cod_amount: Number(formData.cod_amount),
        note: formData.note.trim(),
      };

      const response = await fetch('/api/steadfast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials,
          courierData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create parcel');
      }

      // Create entry for local storage
      const entry: CourierEntry = {
        id: generateId(),
        ...courierData,
        status: 'pending',
        consignment_id: data.consignment?.consignment_id?.toString(),
        tracking_code: data.consignment?.tracking_code,
        created_at: new Date().toISOString(),
      };

      addEntry(entry);

      showToast('Parcel created successfully!', 'success');

      // Reset form
      setFormData(initialFormData);
      setRawText('');
    } catch (error) {
      console.error('Submit error:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to create parcel',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setRawText('');
    setErrors({});
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courier Entry</h1>
        <p className="text-gray-600 mt-1">Create a new parcel order</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'ai'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          )}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Entry
          </span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'manual'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          )}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Manual Entry
          </span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Extraction Panel */}
        {activeTab === 'ai' && (
          <Card>
            <CardHeader>
              <CardTitle>AI Text Extraction</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                label="Paste order details"
                placeholder="Paste the raw order text here. Include name, phone, address, and COD amount..."
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <Button
                onClick={handleExtract}
                className="mt-4 w-full"
                isLoading={isExtracting}
                disabled={!rawText.trim()}
              >
                {isExtracting ? 'Extracting...' : 'Extract with AI'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Form Panel */}
        <Card className={activeTab === 'manual' ? 'lg:col-span-2 max-w-xl' : ''}>
          <CardHeader>
            <CardTitle>Parcel Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Invoice / Order ID"
                placeholder="Auto-generated if empty"
                value={formData.invoice}
                onChange={(e) => handleInputChange('invoice', e.target.value)}
              />

              <Input
                label="Recipient Name"
                placeholder="Enter recipient name"
                value={formData.recipient_name}
                onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                error={errors.recipient_name}
              />

              <Input
                label="Phone Number"
                placeholder="01XXXXXXXXX"
                value={formData.recipient_phone}
                onChange={(e) => handleInputChange('recipient_phone', e.target.value)}
                error={errors.recipient_phone}
              />

              <Textarea
                label="Delivery Address"
                placeholder="Enter full delivery address"
                rows={3}
                value={formData.recipient_address}
                onChange={(e) => handleInputChange('recipient_address', e.target.value)}
                error={errors.recipient_address}
              />

              <Input
                label="COD Amount (BDT)"
                type="number"
                placeholder="Enter COD amount"
                value={formData.cod_amount}
                onChange={(e) => handleInputChange('cod_amount', e.target.value)}
                error={errors.cod_amount}
              />

              <Textarea
                label="Note (Optional)"
                placeholder="Any special instructions..."
                rows={2}
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Parcel'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
