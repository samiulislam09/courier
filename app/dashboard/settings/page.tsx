'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { downloadFile } from '@/utils';

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const credentials = useAppStore((state) => state.credentials);
  const entries = useAppStore((state) => state.entries);
  const googleTokens = useAppStore((state) => state.googleTokens);
  const setCredentials = useAppStore((state) => state.setCredentials);
  const clearCredentials = useAppStore((state) => state.clearCredentials);
  const clearEntries = useAppStore((state) => state.clearEntries);
  const clearGoogleTokens = useAppStore((state) => state.clearGoogleTokens);

  const [apiKey, setApiKey] = useState(credentials?.apiKey || '');
  const [secretKey, setSecretKey] = useState(credentials?.secretKey || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim() || !secretKey.trim()) {
      showToast('Please fill in both fields', 'warning');
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch('/api/steadfast/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, secretKey }),
      });

      const data = await response.json();

      if (data.valid) {
        setCredentials({ apiKey, secretKey });
        showToast('Credentials updated successfully', 'success');
      } else {
        showToast(data.message || 'Invalid credentials', 'error');
      }
    } catch {
      // Save anyway
      setCredentials({ apiKey, secretKey });
      showToast('Credentials saved (could not validate)', 'warning');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout? Your credentials will be cleared.')) {
      clearCredentials();
      router.push('/setup');
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all courier entries? This cannot be undone.')) {
      clearEntries();
      showToast('All entries cleared', 'success');
    }
  };

  const handleLocalBackup = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      entries,
    };

    const date = new Date().toISOString().split('T')[0];
    downloadFile(
      JSON.stringify(data, null, 2),
      `courier-backup-${date}.json`,
      'application/json'
    );
    showToast('Backup downloaded', 'success');
  };

  const handleGoogleBackup = async () => {
    if (!googleTokens) {
      // Redirect to Google OAuth
      window.location.href = '/api/backup/auth';
      return;
    }

    setIsBackingUp(true);

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: googleTokens,
          data: { entries },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'token_expired') {
          clearGoogleTokens();
          showToast('Google auth expired. Please reconnect.', 'warning');
          return;
        }
        throw new Error(result.error || 'Backup failed');
      }

      showToast(`Backup saved: ${result.file.name}`, 'success');
    } catch (error) {
      console.error('Backup error:', error);
      showToast(
        error instanceof Error ? error.message : 'Backup failed',
        'error'
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDisconnectGoogle = () => {
    if (confirm('Disconnect Google Drive?')) {
      clearGoogleTokens();
      showToast('Google Drive disconnected', 'success');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* API Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Steadfast API Credentials</CardTitle>
            <CardDescription>Update your API credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <Input
                label="API Key"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Input
                label="Secret Key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
              <div className="flex gap-3">
                <Button type="submit" isLoading={isUpdating}>
                  Update Credentials
                </Button>
                <Button type="button" variant="danger" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Backup Options */}
        <Card>
          <CardHeader>
            <CardTitle>Backup & Restore</CardTitle>
            <CardDescription>
              Back up your data to local file or Google Drive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleLocalBackup}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Local Backup
              </Button>
              <Button
                variant="outline"
                onClick={handleGoogleBackup}
                isLoading={isBackingUp}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                {googleTokens ? 'Backup to Google Drive' : 'Connect Google Drive'}
              </Button>
            </div>

            {googleTokens && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-800">Google Drive connected</span>
                </div>
                <button
                  onClick={handleDisconnectGoogle}
                  className="text-sm text-green-700 hover:text-green-900 font-medium"
                >
                  Disconnect
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restore from file
              </label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const data = JSON.parse(event.target?.result as string);
                        if (data.entries && Array.isArray(data.entries)) {
                          if (confirm(`Restore ${data.entries.length} entries? This will merge with existing data.`)) {
                            const store = useAppStore.getState();
                            const existingIds = new Set(store.entries.map((e) => e.id));
                            const newEntries = data.entries.filter((e: { id: string }) => !existingIds.has(e.id));
                            newEntries.forEach((entry: Parameters<typeof store.addEntry>[0]) => store.addEntry(entry));
                            showToast(`Restored ${newEntries.length} new entries`, 'success');
                          }
                        } else {
                          showToast('Invalid backup file', 'error');
                        }
                      } catch {
                        showToast('Failed to parse backup file', 'error');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your stored data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {entries.length} courier entries stored
                </p>
                <p className="text-sm text-gray-500">
                  Data is stored in your browser&apos;s local storage
                </p>
              </div>
              <Button variant="danger" onClick={handleClearData}>
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Courier Manager</strong> v1.0.0</p>
              <p>Steadfast Courier Integration with AI-powered data extraction</p>
              <p className="pt-2 text-xs text-gray-400">
                All data is stored locally in your browser. No database required.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
