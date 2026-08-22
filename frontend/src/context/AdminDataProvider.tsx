import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { AdminDataContext } from './admin-data-context';
import type { AdminDataContextValue } from './admin-data-context';
import { useAsync } from '../lib/useAsync';
import { getDealers } from '../services/dealerService';
import { getOrders } from '../services/orderService';
import { getProducts } from '../services/productService';
import type { Dealer, Order, Product } from '../types';

interface AdminData {
  dealers: Dealer[];
  products: Product[];
  orders: Order[];
}

const EMPTY: AdminData = { dealers: [], products: [], orders: [] };

/**
 * Loads all three collections once for the whole admin area.
 *
 * The previous portal fetched them twice on every page: the stats strip pulled sellers,
 * products and orders on mount, then whichever manager was routed below it fetched its own
 * copy again. Mutations call `refresh()` so the dashboard and the tables never disagree.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useAsync<AdminData>(async () => {
    const [dealers, products, orders] = await Promise.all([getDealers(), getProducts(), getOrders()]);
    return { dealers, products, orders };
  }, EMPTY);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      dealers: data.dealers,
      products: data.products,
      orders: data.orders,
      loading,
      error,
      refresh: reload,
    }),
    [data, loading, error, reload],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}
