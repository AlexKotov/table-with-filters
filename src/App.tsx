import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IncidentStatus, SortOption } from './types';
import { DashboardContext, Dashboard } from './components';
import './App.css';

const theme = createTheme({
  palette: {
    primary: { main: '#5667d8' },
    background: { default: '#f3f6fc' },
  },
  typography: { fontFamily: '"Inter", "Segoe UI", sans-serif' },
  shape: { borderRadius: 12 },
});

const queryClient = new QueryClient();

function App() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<IncidentStatus | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('updatedAt');
  const [selectedId, setSelectedId] = useState<string | null>('INC-1002');
  const state = {
    search,
    status,
    sort,
    selectedId,
    setSearch,
    setStatus,
    setSort,
    setSelectedId,
  };
  return (
    <DashboardContext.Provider value={state}>
      <Dashboard />
    </DashboardContext.Provider>
  );
}

export default function AppWithProviders() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
