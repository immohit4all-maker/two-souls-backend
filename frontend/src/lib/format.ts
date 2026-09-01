import type { Numeric } from '../types';

/**
 * Coerce an API value to a number. Fields come back as either strings or numbers depending on
 * how they were written, so nothing numeric should be used without passing through here.
 */
export function toNumber(value: Numeric | null | undefined, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Locale and currency for the whole app.
 *
 * `en-IN` is doing real work here beyond the ₹ symbol: it groups by lakh and crore
 * (₹12,50,000 rather than ₹1,250,000) and its compact notation yields ₹12.5L / ₹2.5Cr, which is
 * how the numbers are actually read in India. Change these two constants to move the app to
 * another market — nothing else hardcodes a currency.
 */
export const LOCALE = 'en-IN';
export const DEFAULT_CURRENCY = 'INR';

/** Above this, dashboard tiles switch to compact notation. One lakh. */
const COMPACT_FROM = 100_000;

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(value: Numeric | null | undefined, currency = DEFAULT_CURRENCY): string {
  const amount = toNumber(value);
  // Indian retail prices are written without paise unless there are paise: ₹1,299 and ₹1,299.50,
  // never ₹1,299.00. Cache per digit-shape since the two need different formatters.
  const whole = Number.isInteger(amount);
  const key = `${currency}:${whole ? 0 : 2}`;

  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter.format(amount);
}

/** Compact form for dashboard tiles: 1250000 -> "₹12.5L". */
export function formatCompactCurrency(
  value: Numeric | null | undefined,
  currency = DEFAULT_CURRENCY,
): string {
  const amount = toNumber(value);
  if (Math.abs(amount) < COMPACT_FROM) return formatCurrency(amount, currency);
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Just the symbol — for prefixing a bare number input. */
export function currencySymbol(currency = DEFAULT_CURRENCY): string {
  return (
    new Intl.NumberFormat(LOCALE, { style: 'currency', currency, minimumFractionDigits: 0 })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? ''
  );
}

/** Fixed-2 string, for building API payloads (see the `Numeric` note in types). */
export function money(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(2);
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Best available timestamp for an record, preferring the explicit one. */
export function timestampOf(record: { placed_at?: string; created_at?: string }): number | null {
  const raw = record.placed_at ?? record.created_at;
  if (!raw) return null;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function initials(value?: string, max = 2): string {
  if (!value) return '?';
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function titleCase(value?: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => (word[0] ?? '').toUpperCase() + word.slice(1))
    .join(' ');
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/** Join conditional class names. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Crockford-style alphabet: no I, L, O or U, so an order number read aloud or copied off a
 * screen is unambiguous. 32 characters divides 256 evenly, so the byte-to-character mapping
 * introduces no bias.
 */
const ORDER_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateOrderNumber(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const byte of bytes) {
    suffix += ORDER_ALPHABET[byte % ORDER_ALPHABET.length] ?? '0';
  }
  return `TS-${suffix}`;
}
