'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setGoogleTokens = useAppStore((state) => state.setGoogleTokens);

  useEffect(() => {
    const tokensParam = searchParams.get('tokens');
    
    if (tokensParam) {
      try {
        const tokens = JSON.parse(decodeURIComponent(tokensParam));
        setGoogleTokens(tokens);
        router.replace('/dashboard/settings?google=connected');
      } catch (error) {
        console.error('Failed to parse tokens:', error);
        router.replace('/dashboard/settings?error=invalid_tokens');
      }
    } else {
      router.replace('/dashboard/settings?error=no_tokens');
    }
  }, [searchParams, setGoogleTokens, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600">Connecting Google Drive...</p>
      </div>
    </div>
  );
}

export default function CallbackSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
