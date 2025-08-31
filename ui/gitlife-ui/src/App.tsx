import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './presentation/providers/AppProvider';
import { ThemeProvider } from './presentation/providers/ThemeProvider';
import { ReadingListPage } from './presentation/pages/ReadingListPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProvider>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
            <ReadingListPage />
          </div>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};