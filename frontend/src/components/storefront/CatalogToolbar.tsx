import { PRICE_BUCKETS, SORT_OPTIONS } from '../../lib/product';
import type { SortOption } from '../../lib/product';
import { cx } from '../../lib/format';
import { Icon } from '../ui/Icon';

export interface CatalogFilters {
  query: string;
  category: string;
  priceBucket: string | null;
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

/**
 * Search, category, price and sort controls.
 *
 * The old storefront had category pills only — no search, no price filter, no sort — which is
 * the bare minimum for browsing a gift catalogue. Categories are a real tablist so arrow keys
 * and screen readers behave as expected.
 */
export function CatalogToolbar({
  filters,
  categories,
  savedCount,
  resultCount,
  onChange,
  onReset,
}: CatalogToolbarProps) {
  const hasActiveFilters =
    filters.query !== '' ||
    filters.category !== 'ALL' ||
    filters.priceBucket !== null ||
    filters.savedOnly;

  return (
    <div className="catalog-toolbar">
      <div className="catalog-toolbar-row">
        <div className="catalog-search">
          <Icon name="search" size={18} className="catalog-search-icon" />
          <input
            type="search"
            className="input catalog-search-input"
            placeholder="Search gifts, makers, materials…"
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

      <div className="catalog-toolbar-row catalog-toolbar-filters">
        <div className="chip-row" role="tablist" aria-label="Product categories">
          {categories.map((category) => {
            const active = filters.category === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                className={cx('chip', active && 'chip-active')}
                onClick={() => onChange({ category })}
              >
                {category === 'ALL' ? 'Everything' : category}
              </button>
            );
          })}
        </div>

        <div className="chip-row">
          {PRICE_BUCKETS.map((bucket) => {
            const active = filters.priceBucket === bucket.id;
            return (
              <button
                key={bucket.id}
                type="button"
                className={cx('chip', 'chip-price', active && 'chip-active')}
                onClick={() => onChange({ priceBucket: active ? null : bucket.id })}
                aria-pressed={active}
              >
                {bucket.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="catalog-result-bar">
        <p className="catalog-count" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'gift' : 'gifts'}
        </p>
        {hasActiveFilters && (
          <button type="button" className="catalog-reset" onClick={onReset}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
