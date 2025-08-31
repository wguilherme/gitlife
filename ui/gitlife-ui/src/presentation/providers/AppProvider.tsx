import React, { createContext, useContext, useState } from 'react';

interface AppState {
  isLoading: boolean;
  error: string | null;
  vaultStatus: 'connected' | 'disconnected' | 'syncing';
}

interface AppContextType {
  state: AppState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setVaultStatus: (status: AppState['vaultStatus']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    isLoading: false,
    error: null,
    vaultStatus: 'disconnected',
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setVaultStatus = (vaultStatus: AppState['vaultStatus']) => {
    setState(prev => ({ ...prev, vaultStatus }));
  };

  const value = {
    state,
    setLoading,
    setError,
    setVaultStatus,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};