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
 */
export const PRICE_BUCKETS: readonly PriceBucket[] = [
  { id: 'under-25', label: 'Under $25', short: 'Under $25', min: 0, max: 25 },
  { id: '25-50', label: '$25 to $50', short: '$25–$50', min: 25, max: 50 },
  { id: '50-100', label: '$50 to $100', short: '$50–$100', min: 50, max: 100 },
  { id: 'over-100', label: '$100 and up', short: '$100+', min: 100, max: Number.POSITIVE_INFINITY },
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
