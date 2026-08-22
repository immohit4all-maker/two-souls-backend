import type { Dealer } from '../types';

/**
 * Display name for a dealer.
 *
 * Every field on a dealer record is optional, so this falls back through whatever was actually
 * filled in before giving up. Without it a half-filled record renders as a blank table row, an
 * empty `<option>`, and an "Edit " button with nothing after it for screen readers.
 */
export function dealerLabel(dealer: Dealer | null | undefined, fallback = 'Unnamed dealer'): string {
  if (!dealer) return fallback;
  return (
    dealer.store_name?.trim() ||
    dealer.business_name?.trim() ||
    dealer.name?.trim() ||
    dealer.email?.trim() ||
    fallback
  );
}

/** Best available way to reach a dealer, or null when nothing was recorded. */
export function dealerContact(dealer: Dealer): { kind: 'email' | 'phone'; value: string } | null {
  const email = dealer.email?.trim();
  if (email) return { kind: 'email', value: email };

  const phone = dealer.phone_number?.trim();
  if (phone) return { kind: 'phone', value: phone };

  return null;
}
