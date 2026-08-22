import { createContext, useContext } from 'react';
import type { Product, Seller } from '../types';

export interface CatalogContextValue {
  /** Products a shopper may see — drafts and archived listings are filtered out. */
  products: Product[];
  sellers: Seller[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
