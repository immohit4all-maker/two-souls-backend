import { useMemo, useRef, useState } from 'react';
import { pluralize } from '../../lib/format';
import { matchesBucket, PRICE_BUCKETS } from '../../lib/product';
import { TAG_GROUPS, tagCounts, tagsInGroup } from '../../lib/giftTags';
import type { TagGroupId } from '../../lib/giftTags';
import type { Product } from '../../types';

/** Budget is a fourth facet alongside the tag groups, but is computed from price, not tags. */
type FacetId = TagGroupId | 'budget';

export interface GiftFinderProps {
  products: Product[];
  activeTag: string | null;
  activeBucket: string | null;
  onPickTag: (tagId: string | null) => void;
  onPickBucket: (bucketId: string | null) => void;
}

interface FacetOption {
  id: string;
  label: string;
  count: number;
  active: boolean;
  select: () => void;
}

/**
 * One place to start a gift search: by occasion, festival, recipient or budget.
 *
 * Facets with nothing behind them are hidden rather than shown as dead ends — so on a catalogue
 * with no tags yet only Budget appears, and the others light up as products get tagged in the
 * admin. That keeps the section honest instead of advertising empty categories.
 */
export function GiftFinder({
  products,
  activeTag,
  activeBucket,
  onPickTag,
  onPickBucket,
}: GiftFinderProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const facets = useMemo(() => {
    const counts = tagCounts(products);

    const tagFacets = TAG_GROUPS.map((group) => {
      const options: FacetOption[] = tagsInGroup(group.id)
        .map((tag) => ({
          id: tag.id,
          label: tag.label,
          count: counts.get(tag.id) ?? 0,
          active: activeTag === tag.id,
          select: () => onPickTag(activeTag === tag.id ? null : tag.id),
        }))
        // Nothing tagged means nothing to browse — leave it out.
        .filter((option) => option.count > 0);

      return { id: group.id as FacetId, label: group.label, blurb: group.blurb, options };
    }).filter((facet) => facet.options.length > 0);

    const budgetOptions: FacetOption[] = PRICE_BUCKETS.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      count: products.filter((product) => matchesBucket(product, bucket)).length,
      active: activeBucket === bucket.id,
      select: () => onPickBucket(activeBucket === bucket.id ? null : bucket.id),
    })).filter((option) => option.count > 0);

    if (budgetOptions.length > 0) {
      tagFacets.push({
        id: 'budget',
        label: 'Budget',
        blurb: 'Know what you want to spend? Start there.',
        options: budgetOptions,
      });
    }

    return tagFacets;
  }, [products, activeTag, activeBucket, onPickTag, onPickBucket]);

  const [selected, setSelected] = useState<FacetId | null>(null);
  // Fall back to the first available facet, and recover automatically if the chosen one empties.
  const activeFacet = facets.find((facet) => facet.id === selected) ?? facets[0];

  if (!activeFacet) return null;

  const activeIndex = facets.indexOf(activeFacet);

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = (activeIndex + delta + facets.length) % facets.length;
    const facet = facets[next];
    if (facet) {
      setSelected(facet.id);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <section className="finder" aria-labelledby="finder-heading">
      <div className="section-head">
        <div>
          <p className="eyebrow">Not sure where to start?</p>
          <h2 className="section-title" id="finder-heading">
            Find the right gift
          </h2>
        </div>
      </div>

      <div className="finder-panel">
        <div className="finder-tabs" role="tablist" aria-label="Ways to find a gift">
          {facets.map((facet, index) => {
            const isActive = facet.id === activeFacet.id;
            return (
              <button
                key={facet.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`finder-tab-${facet.id}`}
                aria-selected={isActive}
                aria-controls="finder-options"
                tabIndex={isActive ? 0 : -1}
                className={isActive ? 'finder-tab is-active' : 'finder-tab'}
                onClick={() => setSelected(facet.id)}
                onKeyDown={onTabKeyDown}
              >
                {facet.label}
              </button>
            );
          })}
        </div>

        <div
          className="finder-body"
          id="finder-options"
          role="tabpanel"
          aria-labelledby={`finder-tab-${activeFacet.id}`}
        >
          <p className="finder-blurb">{activeFacet.blurb}</p>

          <ul className="finder-grid">
            {activeFacet.options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={option.active ? 'finder-chip is-active' : 'finder-chip'}
                  aria-pressed={option.active}
                  onClick={option.select}
                >
                  <span className="finder-chip-label">{option.label}</span>
                  <span className="finder-chip-count">
                    {option.count} {pluralize(option.count, 'gift')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
