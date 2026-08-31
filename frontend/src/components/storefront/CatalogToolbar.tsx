import { bucketById, SORT_OPTIONS } from '../../lib/product';
import type { SortOption } from '../../lib/product';
import { tagById } from '../../lib/giftTags';
import { cx } from '../../lib/format';
import { Icon } from '../ui/Icon';

export interface CatalogFilters {
  query: string;
  category: string;
  priceBucket: string | null;
  /** A gift-finder tag id — occasion, festival or recipient. */
  tag: string | null;
  sort: SortOption;
  savedOnly: boolean;
}

export interface CatalogToolbarProps {
  filters: CatalogFilters;
  categories: string[];
  savedCount: number;
  resultCount: number;
  onChange: (next: Partial<CatalogFilters>) => void;
  onReset: () => void;
}

interface ActivePill {
  key: string;
  label: string;
  clear: () => void;
}

/**
 * Search, category, sort and the active-filter summary.
 *
 * The summary row matters now that filters can be set from three different places (the hero
 * search, the category rail and the gift finder) — without it a shopper who clicked "Diwali"
 * further up the page has no idea why the grid is short, or how to undo it.
 */
export function CatalogToolbar({
  filters,
  categories,
  savedCount,
  resultCount,
  onChange,
  onReset,
}: CatalogToolbarProps) {
  const bucket = bucketById(filters.priceBucket);
  const tag = tagById(filters.tag);

  const active: ActivePill[] = [
    filters.query.trim() && {
      key: 'query',
      label: `“${filters.query.trim()}”`,
      clear: () => onChange({ query: '' }),
    },
    filters.category !== 'ALL' && {
      key: 'category',
      label: filters.category,
      clear: () => onChange({ category: 'ALL' }),
    },
    tag && { key: 'tag', label: tag.label, clear: () => onChange({ tag: null }) },
    bucket && { key: 'bucket', label: bucket.label, clear: () => onChange({ priceBucket: null }) },
    filters.savedOnly && {
      key: 'saved',
      label: 'Saved only',
      clear: () => onChange({ savedOnly: false }),
    },
  ].filter((pill): pill is ActivePill => Boolean(pill));

  return (
    <div className="catalog-toolbar">
      <div className="catalog-toolbar-row">
        <div className="catalog-search">
          <Icon name="search" size={18} className="catalog-search-icon" />
          <input
            type="search"
            className="input catalog-search-input"
            placeholder="Search gifts, materials, occasions…"
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            aria-label="Search the catalogue"
          />
        </div>

        <div className="catalog-toolbar-actions">
          <button
            type="button"
            className={cx('chip', 'chip-saved', filters.savedOnly && 'chip-active')}
            onClick={() => onChange({ savedOnly: !filters.savedOnly })}
            aria-pressed={filters.savedOnly}
            disabled={savedCount === 0 && !filters.savedOnly}
          >
            <Icon name="heart" size={15} filled={filters.savedOnly} />
            Saved
            {savedCount > 0 && <span className="chip-count">{savedCount}</span>}
          </button>

          <label className="catalog-sort">
            <span className="sr-only">Sort products</span>
            <select
              className="input select catalog-sort-select"
              value={filters.sort}
              onChange={(event) => onChange({ sort: event.target.value as SortOption })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={16} className="catalog-sort-chevron" />
          </label>
        </div>
      </div>

      {/* Plain toggle buttons rather than role="tab": these are independent filters, and a
          tablist without arrow-key navigation announces behaviour the widget does not have. */}
      <div className="chip-row" role="group" aria-label="Filter by category">
        {categories.map((category) => {
          const selected = filters.category === category;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={selected}
              className={cx('chip', selected && 'chip-active')}
              onClick={() => onChange({ category })}
            >
              {category === 'ALL' ? 'Everything' : category}
            </button>
          );
        })}
      </div>

      <div className="catalog-result-bar">
        <p className="catalog-count" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'gift' : 'gifts'}
        </p>

        {active.length > 0 && (
          <div className="active-filters">
            {active.map((pill) => (
              <button
                key={pill.key}
                type="button"
                className="active-pill"
                onClick={pill.clear}
                aria-label={`Remove filter: ${pill.label}`}
              >
                {pill.label}
                <Icon name="close" size={13} />
              </button>
            ))}
            <button type="button" className="catalog-reset" onClick={onReset}>
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
