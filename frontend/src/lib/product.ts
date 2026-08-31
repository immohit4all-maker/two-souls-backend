import type { Product } from '../types';
import { toNumber } from './format';

/** Stock as a number, or undefined when the field was never set. */
export function stockOf(product: Product): number | undefined {
  const raw = product.stock_quantity;
  if (raw === undefined || raw === null || raw === '') return undefined;
  return toNumber(raw);
}

export function isSoldOut(product: Product): boolean {
  if (product.status === 'OUT_OF_STOCK') return true;
  const stock = stockOf(product);
  return stock !== undefined && stock <= 0;
}

/** Used by the storefront for an urgency cue and by the admin low-stock panel. */
export function isLowStock(product: Product, threshold = 5): boolean {
  const stock = stockOf(product);
  return stock !== undefined && stock > 0 && stock <= threshold;
}

export interface PriceBucket {
  id: string;
  label: string;
  /** Shorter label for the browse-by-price rail. */
  short: string;
  min: number;
  max: number;
}

/**
 * Browsing by budget is how people actually shop for gifts, so these back both the hero rail
 * and the catalog filter — one definition, two entry points.
 *
 * Bands are set for the Indian market: a typical gifting ladder runs from a small token under
 * ₹500 up to a considered present past ₹3,000. Adjust to suit your catalogue.
 */
export const PRICE_BUCKETS: readonly PriceBucket[] = [
  { id: 'under-500', label: 'Under ₹500', short: 'Under ₹500', min: 0, max: 500 },
  { id: '500-1500', label: '₹500 to ₹1,500', short: '₹500–₹1.5k', min: 500, max: 1500 },
  { id: '1500-3000', label: '₹1,500 to ₹3,000', short: '₹1.5k–₹3k', min: 1500, max: 3000 },
  {
    id: 'over-3000',
    label: '₹3,000 and up',
    short: '₹3k+',
    min: 3000,
    max: Number.POSITIVE_INFINITY,
  },
];

export function bucketById(id: string | null): PriceBucket | undefined {
  return id ? PRICE_BUCKETS.find((bucket) => bucket.id === id) : undefined;
}

export function matchesBucket(product: Product, bucket: PriceBucket | undefined): boolean {
  if (!bucket) return true;
  const price = toNumber(product.sell_price);
  return price >= bucket.min && price < bucket.max;
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest';

export const SORT_OPTIONS: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  if (sort === 'featured') return products;
  const sorted = [...products];

  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => toNumber(a.sell_price) - toNumber(b.sell_price));
    case 'price-desc':
      return sorted.sort((a, b) => toNumber(b.sell_price) - toNumber(a.sell_price));
    case 'name-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      );
    default:
      return sorted;
  }
}
