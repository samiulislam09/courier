'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button } from '@/components/ui';
import CourierStatistics from '@/components/CourierStatistics';

export default function FraudCheckPage() {
  const credentials = useAppStore((state) => state.credentials);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  const handleSearch = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      setSearchPhone(cleaned);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fraud Check</h1>
        <p className="text-gray-600 mt-1">Check customer delivery history before processing orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Lookup</CardTitle>
          <CardDescription>
            Enter a mobile number to check delivery statistics across all couriers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter mobile number (01XXXXXXXXX)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={phoneNumber.replace(/\D/g, '').length < 10}
            >
              Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchPhone && (
        <CourierStatistics 
          phoneNumber={searchPhone} 
          credentials={credentials}
          className="mt-0"
        />
      )}

      {!searchPhone && (
        <div className="mt-6 text-center py-12 text-gray-500">
          <svg 
            className="w-16 h-16 mx-auto mb-4 text-gray-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <p>Enter a phone number to check customer delivery history</p>
        </div>
      )}
    </div>
  );
}
