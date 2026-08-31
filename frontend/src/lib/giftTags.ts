import type { Product } from '../types';

/**
 * Gift tags — the facets shoppers browse by.
 *
 * Products carry a `tags: string[]` of these ids. Everything is driven from this one file: the
 * admin's tag picker, the storefront gift finder, and the catalogue filter all read it, so
 * adding a festival is a one-line change here and it appears in all three.
 *
 * Ids are stored on the record and must not change once products are tagged. Labels are free to
 * be reworded.
 */
export type TagGroupId = 'occasion' | 'festival' | 'recipient';

export interface GiftTag {
  id: string;
  label: string;
  group: TagGroupId;
}

export interface TagGroup {
  id: TagGroupId;
  label: string;
  blurb: string;
}

export const TAG_GROUPS: readonly TagGroup[] = [
  { id: 'occasion', label: 'Occasion', blurb: 'Birthdays, weddings, new homes and everything between.' },
  { id: 'festival', label: 'Festival', blurb: 'Ready for the season, whichever one you are celebrating.' },
  { id: 'recipient', label: 'Who it is for', blurb: 'Start from the person and work back to the gift.' },
];

export const GIFT_TAGS: readonly GiftTag[] = [
  // Occasions and events
  { id: 'birthday', label: 'Birthday', group: 'occasion' },
  { id: 'anniversary', label: 'Anniversary', group: 'occasion' },
  { id: 'wedding', label: 'Wedding', group: 'occasion' },
  { id: 'engagement', label: 'Engagement', group: 'occasion' },
  { id: 'housewarming', label: 'Housewarming', group: 'occasion' },
  { id: 'baby-shower', label: 'Baby shower', group: 'occasion' },
  { id: 'farewell', label: 'Farewell', group: 'occasion' },
  { id: 'thank-you', label: 'Thank you', group: 'occasion' },
  { id: 'congratulations', label: 'Congratulations', group: 'occasion' },

  // Festivals across the Indian calendar
  { id: 'diwali', label: 'Diwali', group: 'festival' },
  { id: 'raksha-bandhan', label: 'Raksha Bandhan', group: 'festival' },
  { id: 'holi', label: 'Holi', group: 'festival' },
  { id: 'navratri', label: 'Navratri', group: 'festival' },
  { id: 'ganesh-chaturthi', label: 'Ganesh Chaturthi', group: 'festival' },
  { id: 'onam', label: 'Onam', group: 'festival' },
  { id: 'pongal', label: 'Pongal', group: 'festival' },
  { id: 'eid', label: 'Eid', group: 'festival' },
  { id: 'christmas', label: 'Christmas', group: 'festival' },
  { id: 'new-year', label: 'New Year', group: 'festival' },

  // Recipients
  { id: 'for-her', label: 'For her', group: 'recipient' },
  { id: 'for-him', label: 'For him', group: 'recipient' },
  { id: 'for-parents', label: 'For parents', group: 'recipient' },
  { id: 'for-couples', label: 'For couples', group: 'recipient' },
  { id: 'for-kids', label: 'For kids', group: 'recipient' },
  { id: 'for-friends', label: 'For friends', group: 'recipient' },
  { id: 'for-colleagues', label: 'For colleagues', group: 'recipient' },
];

const TAGS_BY_ID = new Map(GIFT_TAGS.map((tag) => [tag.id, tag]));

export function tagById(id: string | null | undefined): GiftTag | undefined {
  return id ? TAGS_BY_ID.get(id) : undefined;
}

export function tagsInGroup(group: TagGroupId): GiftTag[] {
  return GIFT_TAGS.filter((tag) => tag.group === group);
}

/** Tags actually recorded on a product, ignoring anything unrecognised. */
export function tagsOf(product: Product): GiftTag[] {
  if (!Array.isArray(product.tags)) return [];
  return product.tags.map((id) => TAGS_BY_ID.get(id)).filter((tag): tag is GiftTag => Boolean(tag));
}

export function hasTag(product: Product, tagId: string | null): boolean {
  if (!tagId) return true;
  return Array.isArray(product.tags) && product.tags.includes(tagId);
}

/** How many products carry each tag, so empty facets can be hidden rather than dead-ended. */
export function tagCounts(products: Product[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (!Array.isArray(product.tags)) continue;
    for (const id of product.tags) {
      if (TAGS_BY_ID.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}
