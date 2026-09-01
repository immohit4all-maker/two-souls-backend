import type { Product, ProductSourcing } from '../types';
import { toNumber } from './format';

/**
 * The catalogue's fixed category list.
 *
 * Shared so the admin dropdown and anything else reading categories cannot drift. A product
 * saved under an older, free-text category keeps it — see ProductFormModal, which appends any
 * unrecognised value to the options rather than silently reassigning the product.
 */
export const PRODUCT_CATEGORIES = [
  'German Silver',
  '999 Fine Silver',
  'Home Decor',
  'Others',
] as const;

/**
 * Every dealer who can supply this product.
 *
 * Falls back to the legacy single-dealer fields so records created before multi-dealer sourcing
 * still resolve to one entry instead of appearing unsourced.
 */
export function sourcingOf(product: Product): ProductSourcing[] {
  if (Array.isArray(product.sourcing) && product.sourcing.length > 0) {
    return product.sourcing.filter((entry) => Boolean(entry?.seller_id));
  }
  if (product.seller_id) {
    return [{ seller_id: product.seller_id, buy_price: product.buy_price }];
  }
  return [];
}

function knownCosts(product: Product): number[] {
  const costs = sourcingOf(product)
    .map((entry) => entry.buy_price)
    .filter((value): value is NonNullable<typeof value> => value !== undefined && value !== '')
    .map((value) => toNumber(value));

  if (costs.length > 0) return costs;
  // A legacy product may carry a cost with no dealer attached.
  if (product.buy_price !== undefined && product.buy_price !== '') return [toNumber(product.buy_price)];
  return [];
}

/** Cheapest dealer for this product — the one used as the default when an order is placed. */
export function primarySourcing(product: Product): ProductSourcing | undefined {
  const entries = sourcingOf(product);
  if (entries.length === 0) return undefined;

  return entries.reduce((best, entry) => {
    const bestCost = best.buy_price === undefined ? Number.POSITIVE_INFINITY : toNumber(best.buy_price);
    const entryCost = entry.buy_price === undefined ? Number.POSITIVE_INFINITY : toNumber(entry.buy_price);
    return entryCost < bestCost ? entry : best;
  });
}

export function lowestCost(product: Product): number | undefined {
  const costs = knownCosts(product);
  return costs.length > 0 ? Math.min(...costs) : undefined;
}

/** Spread of costs across dealers, for showing "₹400–₹520" in the admin table. */
export function costRange(product: Product): { min: number; max: number } | undefined {
  const costs = knownCosts(product);
  if (costs.length === 0) return undefined;
  return { min: Math.min(...costs), max: Math.max(...costs) };
}

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
