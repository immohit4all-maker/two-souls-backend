export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

/**
 * Single source of truth for status colour across dealers, products, orders and payments.
 * Previously this was three near-identical CSS rule groups that had already drifted apart
 * (`.status-pill.processing` was styled as a warning in one place and not defined in another).
 */
const STATUS_TONES: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  PUBLISHED: 'success',
  DELIVERED: 'success',
  PAID: 'success',

  PENDING: 'warning',
  PROCESSING: 'warning',
  DRAFT: 'warning',

  SHIPPED: 'info',

  SUSPENDED: 'danger',
  CANCELLED: 'danger',
  OUT_OF_STOCK: 'danger',
  FAILED: 'danger',

  INACTIVE: 'neutral',
  ARCHIVED: 'neutral',
  REFUNDED: 'neutral',
};

export function toneForStatus(status?: string): BadgeTone {
  if (!status) return 'neutral';
  return STATUS_TONES[status.toUpperCase()] ?? 'neutral';
}

/** CSS custom property holding the colour for a tone, for use in inline SVG fills. */
export function toneColorVar(tone: BadgeTone): string {
  return tone === 'accent' ? 'var(--accent)' : `var(--${tone})`;
}
