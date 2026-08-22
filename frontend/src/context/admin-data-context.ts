import { createContext, useContext } from 'react';
import type { Order, Product, Seller } from '../types';

export interface AdminDataContextValue {
  sellers: Seller[];
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
