import { createContext, useContext } from 'react';
import { DashboardState } from './../types';

export const DashboardContext = createContext<DashboardState | null>(null);

export const useDashboard = (): DashboardState => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error('useDashboard must be used inside DashboardContext');
  return context;
};
