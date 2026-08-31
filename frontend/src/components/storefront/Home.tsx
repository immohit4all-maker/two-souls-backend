import { useMemo, useState } from 'react';
import { useCatalog } from '../../context/catalog-context';
import { useSavedIds } from '../../lib/savedItems';
import { bucketById, matchesBucket, sortProducts } from '../../lib/product';
import { hasTag, tagsOf } from '../../lib/giftTags';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Skeleton } from '../ui/Skeleton';
import { CatalogToolbar } from './CatalogToolbar';
import type { CatalogFilters } from './CatalogToolbar';
import { CategoryRail } from './CategoryRail';
import { GiftFinder } from './GiftFinder';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';

const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  category: 'ALL',
  priceBucket: null,
  tag: null,
  sort: 'featured',
  savedOnly: false,
};

const PROMISES = [
  { icon: 'sparkle', title: 'Chosen by hand', copy: 'Every piece is picked for the collection, never bulk-listed.' },
  { icon: 'package', title: 'Small-batch quality', copy: 'Short runs and careful making, not mass production.' },
  { icon: 'truck', title: 'Packed to be gifted', copy: 'Arrives wrapped and ready to hand over.' },
  { icon: 'lock', title: 'Secure checkout', copy: 'Your details stay private from start to finish.' },
] as const;

function scrollToCatalog() {
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Home() {
  const { products, loading, error, reload } = useCatalog();
  const savedIds = useSavedIds();
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);

  const update = (next: Partial<CatalogFilters>) =>
    setFilters((current) => ({ ...current, ...next }));

  /** Pick a facet, then take the shopper straight to the results. */
  const pickAndScroll = (next: Partial<CatalogFilters>) => {
    update(next);
    scrollToCatalog();
  };

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) unique.add(product.category);
    });
    return ['ALL', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const visible = useMemo(() => {
    const needle = filters.query.trim().toLowerCase();
    const bucket = bucketById(filters.priceBucket);

    const filtered = products.filter((product) => {
      if (filters.savedOnly && !savedIds.includes(product.product_id)) return false;
      if (filters.category !== 'ALL' && product.category !== filters.category) return false;
      if (!matchesBucket(product, bucket)) return false;
      if (!hasTag(product, filters.tag)) return false;
      if (!needle) return true;

      // Tag labels are searchable, so typing "diwali" or "for her" finds the tagged pieces.
      // Deliberately excludes the sourcing dealer — that is private supply-side information.
      const haystack = [
        product.title,
        product.category,
        product.description,
        product.sku,
        ...tagsOf(product).map((tag) => tag.label),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });

    return sortProducts(filtered, filters.sort);
  }, [products, filters, savedIds]);

  const heroImages = products.filter((product) => product.imageUrl).slice(0, 3);
  const categoryCount = Math.max(0, categories.length - 1);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">
            <Icon name="sparkle" size={14} filled />
            The Two Souls collection
          </p>

          <h1 className="hero-title">
            Gifts with a <em>story</em> behind them.
          </h1>

          <p className="hero-subtitle">
            We hunt down beautiful, small-batch pieces so you don't have to — every one chosen by
            hand, so the thing you give feels considered rather than picked off a shelf.
          </p>

          {/* Search sits in the hero as well as the toolbar: both write the same filter, so
              typing here updates the grid below and Enter jumps you to it. */}
          <form
            className="hero-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              scrollToCatalog();
            }}
          >
            <Icon name="search" size={19} className="hero-search-icon" />
            <input
              type="search"
              className="input hero-search-input"
              placeholder="Search for a gift, a material, an occasion…"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
              aria-label="Search the collection"
            />
            <Button type="submit" size="md" className="hero-search-btn">
              Search
            </Button>
          </form>

          <dl className="hero-stats">
            <div>
              <dt>Pieces</dt>
              <dd>{loading ? '—' : products.length}</dd>
            </div>
            <div>
              <dt>Collections</dt>
              <dd>{loading ? '—' : categoryCount}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>Across India</dd>
            </div>
          </dl>
        </div>

        {/* Collage built from real catalogue photography rather than stock art. */}
        <div className="hero-visual" aria-hidden="true">
          <span className="hero-blob hero-blob-a" />
          <span className="hero-blob hero-blob-b" />

          {/* Plain divs rather than <Skeleton>: the tiles are absolutely positioned, and the
              component's inline width/height would override that placement. */}
          {loading ? (
            <div className="hero-collage">
              <div className="hero-tile hero-tile-1 skeleton" />
              <div className="hero-tile hero-tile-2 skeleton" />
              <div className="hero-tile hero-tile-3 skeleton" />
            </div>
          ) : heroImages.length > 0 ? (
            <div className="hero-collage">
              {heroImages.map((product, index) => (
                <div key={product.product_id} className={`hero-tile hero-tile-${index + 1}`}>
                  <ProductImage src={product.imageUrl} alt="" eager />
                </div>
              ))}
            </div>
          ) : (
            <div className="hero-collage hero-collage-empty">
              <div className="hero-tile hero-tile-1" />
              <div className="hero-tile hero-tile-2" />
              <div className="hero-tile hero-tile-3" />
            </div>
          )}
        </div>
      </section>

      {!loading && !error && (
        <CategoryRail
          products={products}
          active={filters.category}
          onPick={(category) => pickAndScroll({ category })}
        />
      )}

      {!loading && !error && (
        <GiftFinder
          products={products}
          activeTag={filters.tag}
          activeBucket={filters.priceBucket}
          onPickTag={(tag) => pickAndScroll({ tag })}
          onPickBucket={(priceBucket) => pickAndScroll({ priceBucket })}
        />
      )}

      <section className="promises" aria-label="Why shop with us">
        {PROMISES.map((promise) => (
          <div key={promise.title} className="promise">
            <span className="promise-icon">
              <Icon name={promise.icon} size={19} />
            </span>
            <div>
              <p className="promise-title">{promise.title}</p>
              <p className="promise-copy">{promise.copy}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="catalog" id="catalog" aria-labelledby="catalog-heading">
        <div className="section-head">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 className="section-title" id="catalog-heading">
              Every gift, all in one place
            </h2>
          </div>
        </div>

        <CatalogToolbar
          filters={filters}
          categories={categories}
          savedCount={savedIds.length}
          resultCount={visible.length}
          onChange={update}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="product-card-skeleton">
                <Skeleton height="260px" radius="var(--radius-lg)" />
                <Skeleton height="0.75rem" width="40%" />
                <Skeleton height="1rem" width="80%" />
                <Skeleton height="1rem" width="30%" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            tone="error"
            title="We couldn't load the collection"
            description={error}
            action={
              <Button variant="secondary" iconLeft="refresh" onClick={() => void reload()}>
                Try again
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={filters.savedOnly ? 'heart' : 'search'}
            title={filters.savedOnly ? 'Nothing saved yet' : 'No gifts match those filters'}
            description={
              filters.savedOnly
                ? 'Tap the heart on anything you like and it will show up here.'
                : 'Try widening your search or clearing a filter.'
            }
            action={
              <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="product-grid">
            {visible.map((product, index) => (
              <ProductCard key={product.product_id} product={product} eagerImage={index < 4} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
