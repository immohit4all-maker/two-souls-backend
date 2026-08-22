import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { CatalogContext } from './catalog-context';
import type { CatalogContextValue } from './catalog-context';
import { useAsync } from '../lib/useAsync';
import { getProducts } from '../services/productService';
import { getSellers } from '../services/sellerService';
import type { Product, Seller } from '../types';

interface CatalogData {
  products: Product[];
  sellers: Seller[];
}

const EMPTY: CatalogData = { products: [], sellers: [] };

/**
 * Statuses a shopper is allowed to see.
 *
 * The old storefront rendered every product the API returned, so unfinished DRAFT listings and
 * retired ARCHIVED ones were on sale to the public. `OUT_OF_STOCK` stays visible deliberately —
 * it still tells a story and can be marked sold out — but cannot be added to a bag.
 */
const SHOPPER_VISIBLE = new Set(['PUBLISHED', 'OUT_OF_STOCK']);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useAsync<CatalogData>(async () => {
    const [products, sellers] = await Promise.all([getProducts(), getSellers()]);
    return { products, sellers };
  }, EMPTY);

  const value = useMemo<CatalogContextValue>(
    () => ({
      // A missing status means the server default, which is PUBLISHED.
      products: data.products.filter((product) => SHOPPER_VISIBLE.has(product.status ?? 'PUBLISHED')),
      sellers: data.sellers,
      loading,
      error,
      reload,
    }),
    [data, loading, error, reload],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
