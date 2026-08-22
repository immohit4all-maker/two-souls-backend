import { createContext, useContext } from 'react';
import type { Dealer, Order, Product } from '../types';

export interface AdminDataContextValue {
  dealers: Dealer[];
  products: Product[];
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function useAdminData(): AdminDataContextValue {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
}
