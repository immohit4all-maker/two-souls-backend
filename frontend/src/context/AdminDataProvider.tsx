import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { AdminDataContext } from './admin-data-context';
import type { AdminDataContextValue } from './admin-data-context';
import { useAsync } from '../lib/useAsync';
import { getOrders } from '../services/orderService';
import { getProducts } from '../services/productService';
import { getSellers } from '../services/sellerService';
import type { Order, Product, Seller } from '../types';

interface AdminData {
  sellers: Seller[];
  products: Product[];
  orders: Order[];
}

const EMPTY: AdminData = { sellers: [], products: [], orders: [] };

/**
 * Loads all three collections once for the whole admin area.
 *
 * The previous portal fetched them twice on every page: the stats strip pulled sellers,
 * products and orders on mount, then whichever manager was routed below it fetched its own
 * copy again. Mutations call `refresh()` so the dashboard and the tables never disagree.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useAsync<AdminData>(async () => {
    const [sellers, products, orders] = await Promise.all([getSellers(), getProducts(), getOrders()]);
    return { sellers, products, orders };
  }, EMPTY);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      sellers: data.sellers,
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
