import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { CatalogContext } from './catalog-context';
import type { CatalogContextValue } from './catalog-context';
import { useAsync } from '../lib/useAsync';
import { getProducts } from '../services/productService';
import type { Product } from '../types';

const EMPTY: Product[] = [];

/**
 * Statuses a shopper is allowed to see.
 *
 * The old storefront rendered every product the API returned, so unfinished DRAFT listings and
 * retired ARCHIVED ones were on sale to the public. `OUT_OF_STOCK` stays visible deliberately —
 * it can be marked sold out — but cannot be added to a bag.
 */
const SHOPPER_VISIBLE = new Set(['PUBLISHED', 'OUT_OF_STOCK']);

/**
 * The shop deliberately fetches products only. Dealers are a private supply-side relationship
 * and are never named to customers, so there is nothing for the storefront to load them for.
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useAsync<Product[]>(getProducts, EMPTY);

  const value = useMemo<CatalogContextValue>(
    () => ({
      // A missing status means the server default, which is PUBLISHED.
      products: data.filter((product) => SHOPPER_VISIBLE.has(product.status ?? 'PUBLISHED')),
      loading,
      error,
      reload,
    }),
    [data, loading, error, reload],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
