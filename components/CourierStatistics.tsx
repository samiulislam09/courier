'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/utils';

interface CourierDetail {
  success: number;
  cancel: number;
  total: number;
}

interface CourierSuccessRate {
  total: {
    total: number;
    success: number;
    success_rate: number;
  };
  string: string;
  details: Record<string, CourierDetail>;
}

interface SteadfastFraudData {
  status?: number;
  total_parcels?: number;
  total_delivered?: number;
  total_cancelled?: number;
}

interface CourierStatisticsProps {
  phoneNumber: string;
  credentials?: {
    apiKey: string;
    secretKey: string;
  } | null;
  className?: string;
}

const courierColors: Record<string, { bg: string; text: string; border: string }> = {
  pathao: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  steadfast: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  redx: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  carrybee: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
};

const courierNames: Record<string, string> = {
  pathao: 'Pathao',
  steadfast: 'Steadfast',
  redx: 'RedX',
  carrybee: 'Carrybee',
};

function getSuccessRateColor(rate: number): string {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getSuccessRateBg(rate: number): string {
  if (rate >= 80) return 'bg-green-100';
  if (rate >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

export default function CourierStatistics({ phoneNumber, credentials, className }: CourierStatisticsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CourierSuccessRate | null>(null);
  const [steadfastData, setSteadfastData] = useState<SteadfastFraudData | null>(null);

  useEffect(() => {
    if (!phoneNumber || phoneNumber.length < 11) {
      setStats(null);
      setSteadfastData(null);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        // Fetch both APIs in parallel
        const [hoorinResponse, steadfastResponse] = await Promise.all([
          fetch(`/api/courier?searchTerm=${cleanPhone}`).then(res => res.ok ? res.json() : null).catch(() => null),
          credentials?.apiKey && credentials?.secretKey
            ? fetch('/api/steadfast/fraud-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone: cleanPhone,
                  apiKey: credentials.apiKey,
                  secretKey: credentials.secretKey,
                }),
              }).then(res => res.ok ? res.json() : null).catch(() => null)
            : Promise.resolve(null),
        ]);

        // Process Hoorin data (Pathao, RedX, Carrybee only)
        if (hoorinResponse?.courier_success_rate) {
          const originalStats = hoorinResponse.courier_success_rate;
          // Filter to only include pathao, redx, carrybee from Hoorin
          const filteredDetails: Record<string, CourierDetail> = {};
          let filteredTotal = 0;
          let filteredSuccess = 0;
          
          ['pathao', 'redx', 'carrybee'].forEach(courier => {
            if (originalStats.details[courier]) {
              filteredDetails[courier] = originalStats.details[courier];
              filteredTotal += originalStats.details[courier].total;
              filteredSuccess += originalStats.details[courier].success;
            }
          });

          setStats({
            ...originalStats,
            details: filteredDetails,
            total: {
              total: filteredTotal,
              success: filteredSuccess,
              success_rate: filteredTotal > 0 ? Math.round((filteredSuccess / filteredTotal) * 100) : 0,
            },
          });
        }

        // Process Steadfast data
        if (steadfastResponse) {
          setSteadfastData(steadfastResponse);
        }
      } catch (err) {
        console.error('Failed to fetch courier statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [phoneNumber, credentials]);

  if (!phoneNumber || phoneNumber.length < 10) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={cn('mt-4', className)}>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading courier statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('mt-4 border-red-200', className)}>
        <CardContent className="py-4">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const hoorinTotal = stats?.total?.total || 0;
  const steadfastTotal = parseInt(String(steadfastData?.total_parcels || 0)) || 0;

  if (hoorinTotal === 0 && steadfastTotal === 0) {
    return (
      <Card className={cn('mt-4', className)}>
        <CardContent className="py-4">
          <p className="text-sm text-gray-500 text-center">No delivery history found for this number</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate combined totals including Steadfast
  const hoorinSuccess = stats?.total?.success || 0;
  const steadfastSuccess = parseInt(String(steadfastData?.total_delivered || 0)) || 0;
  const steadfastCancel = parseInt(String(steadfastData?.total_cancelled || 0)) || 0;
  
  const combinedTotal = hoorinTotal + steadfastTotal;
  const combinedSuccess = hoorinSuccess + steadfastSuccess;
  const combinedSuccessRate = combinedTotal > 0 ? Math.round((combinedSuccess / combinedTotal) * 100) : 0;

  return (
    <Card className={cn('mt-4', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Customer Delivery History</span>
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            getSuccessRateBg(combinedSuccessRate),
            getSuccessRateColor(combinedSuccessRate)
          )}>
            {combinedSuccessRate}% Success Rate
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-900">{combinedTotal}</p>
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-lg font-semibold text-green-600">{combinedSuccess}</p>
            <p className="text-xs text-gray-500">Successful</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <p className="text-lg font-semibold text-red-600">
              {combinedTotal - combinedSuccess}
            </p>
            <p className="text-xs text-gray-500">Failed/Cancelled</p>
          </div>
        </div>

        {/* Courier Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">By Courier</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Pathao, RedX, Carrybee from Hoorin API */}
            {stats?.details && Object.entries(stats.details).map(([courier, detail]) => {
              if (detail.total === 0) return null;
              const rate = detail.total > 0 ? Math.round((detail.success / detail.total) * 100) : 0;
              const colors = courierColors[courier] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
              
              return (
                <div
                  key={courier}
                  className={cn(
                    'p-2 rounded-lg border',
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-xs font-medium', colors.text)}>
                      {courierNames[courier] || courier}
                    </span>
                    <span className={cn('text-xs font-semibold', getSuccessRateColor(rate))}>
                      {rate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{detail.success}/{detail.total}</span>
                    {detail.cancel > 0 && (
                      <span className="text-red-500">({detail.cancel} cancelled)</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Steadfast from dedicated API */}
            {steadfastTotal > 0 && (
              <div
                className={cn(
                  'p-2 rounded-lg border',
                  courierColors.steadfast.bg,
                  courierColors.steadfast.border
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-xs font-medium', courierColors.steadfast.text)}>
                    Steadfast
                  </span>
                  <span className={cn('text-xs font-semibold', getSuccessRateColor(steadfastTotal > 0 ? Math.round((steadfastSuccess / steadfastTotal) * 100) : 0))}>
                    {steadfastTotal > 0 ? Math.round((steadfastSuccess / steadfastTotal) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{steadfastSuccess}/{steadfastTotal}</span>
                  {steadfastCancel > 0 && (
                    <span className="text-red-500">({steadfastCancel} cancelled)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
