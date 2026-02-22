import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, SteadfastCredentials, CourierEntry, GoogleDriveTokens } from '@/types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Credentials
      credentials: null,
      setCredentials: (credentials: SteadfastCredentials) => 
        set({ credentials }),
      clearCredentials: () => 
        set({ credentials: null }),

      // Courier Entries
      entries: [],
      addEntry: (entry: CourierEntry) =>
        set((state) => ({ 
          entries: [entry, ...state.entries] 
        })),
      updateEntry: (id: string, updates: Partial<CourierEntry>) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        })),
      deleteEntry: (id: string) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),
      clearEntries: () => 
        set({ entries: [] }),

      // Google Drive
      googleTokens: null,
      setGoogleTokens: (tokens: GoogleDriveTokens) =>
        set({ googleTokens: tokens }),
      clearGoogleTokens: () =>
        set({ googleTokens: null }),

      // UI State
      isLoading: false,
      setLoading: (loading: boolean) => 
        set({ isLoading: loading }),
    }),
    {
      name: 'courier-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        credentials: state.credentials,
        entries: state.entries,
        googleTokens: state.googleTokens,
      }),
    }
  )
);

// Selector hooks for better performance
export const useCredentials = () => useAppStore((state) => state.credentials);
export const useEntries = () => useAppStore((state) => state.entries);
export const useGoogleTokens = () => useAppStore((state) => state.googleTokens);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
