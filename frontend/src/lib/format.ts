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

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(value: Numeric | null | undefined, currency = 'USD'): string {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(toNumber(value));
}

/** Compact form for dashboard tiles: 12480 -> "$12.5k". */
export function formatCompactCurrency(value: Numeric | null | undefined, currency = 'USD'): string {
  const amount = toNumber(value);
  if (Math.abs(amount) < 10_000) return formatCurrency(amount, currency);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Fixed-2 string, for building API payloads (see the `Numeric` note in types). */
export function money(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(2);
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
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
