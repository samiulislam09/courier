'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export default function SetupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const setCredentials = useAppStore((state) => state.setCredentials);
  
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [errors, setErrors] = useState<{ apiKey?: string; secretKey?: string }>({});

  const validateForm = () => {
    const newErrors: { apiKey?: string; secretKey?: string } = {};
    
    if (!apiKey.trim()) {
      newErrors.apiKey = 'API Key is required';
    }
    
    if (!secretKey.trim()) {
      newErrors.secretKey = 'Secret Key is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setCredentials({ apiKey, secretKey });
    showToast('Credentials saved!', 'success');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Courier Manager</h1>
          <p className="text-gray-600 mt-2">Connect your Steadfast account to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Setup Credentials</CardTitle>
            <CardDescription>
              Enter your Steadfast API credentials. You can find these in your Steadfast dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="API Key"
                type="text"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                error={errors.apiKey}
              />
              
              <Input
                label="Secret Key"
                type="password"
                placeholder="Enter your secret key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                error={errors.secretKey}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Save & Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Your credentials are stored securely in your browser&apos;s local storage. We don&apos;t have access to them. You can update or delete them anytime from the settings page.
        </p>
      </div>
    </div>
  );
}
