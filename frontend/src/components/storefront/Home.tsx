import { useMemo, useState } from 'react';
import { useCatalog } from '../../context/catalog-context';
import { useSavedIds } from '../../lib/savedItems';
import { bucketById, matchesBucket, PRICE_BUCKETS, sortProducts } from '../../lib/product';
import { pluralize } from '../../lib/format';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Skeleton } from '../ui/Skeleton';
import { CatalogToolbar } from './CatalogToolbar';
import type { CatalogFilters } from './CatalogToolbar';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';
import { SellerRail } from './SellerRail';

const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  category: 'ALL',
  priceBucket: null,
  sort: 'featured',
  savedOnly: false,
};

const PROMISES = [
  { icon: 'sparkle', title: 'Made in small batches', copy: 'No mass production. Every piece is finished by hand.' },
  { icon: 'store', title: 'Straight from the maker', copy: 'You buy from the studio, not a middleman warehouse.' },
  { icon: 'truck', title: 'Packed to be gifted', copy: 'Arrives wrapped and ready to hand over.' },
  { icon: 'lock', title: 'Secure checkout', copy: 'Your details stay private from start to finish.' },
] as const;

function scrollToCatalog() {
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Home() {
  const { products, sellers, loading, error, reload } = useCatalog();
  const savedIds = useSavedIds();
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) unique.add(product.category);
    });
    return ['ALL', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const sellerNames = useMemo(() => {
    const names = new Map<string, string>();
    sellers.forEach((seller) => names.set(seller.seller_id, seller.store_name));
    return names;
  }, [sellers]);

  const visible = useMemo(() => {
    const needle = filters.query.trim().toLowerCase();
    const bucket = bucketById(filters.priceBucket);

    const filtered = products.filter((product) => {
      if (filters.savedOnly && !savedIds.includes(product.product_id)) return false;
      if (filters.category !== 'ALL' && product.category !== filters.category) return false;
      if (!matchesBucket(product, bucket)) return false;
      if (!needle) return true;

      const haystack = [
        product.title,
        product.category,
        product.description,
        product.sku,
        product.seller_id ? sellerNames.get(product.seller_id) : undefined,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });

    return sortProducts(filtered, filters.sort);
  }, [products, filters, savedIds, sellerNames]);

  const heroImages = products.filter((product) => product.imageUrl).slice(0, 3);
  const makerCount = sellers.filter((seller) => (seller.status ?? 'ACTIVE') === 'ACTIVE').length;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">
            <Icon name="sparkle" size={14} filled />
            Handpicked from independent studios
          </p>

          <h1 className="hero-title">
            Gifts with a <em>story</em> behind them.
          </h1>

          <p className="hero-subtitle">
            Every piece on Two Souls is made in small batches by an independent artisan — so the
            thing you give has a maker, a place, and a reason behind it.
          </p>

          <div className="hero-actions">
            <Button size="lg" iconRight="arrow-right" onClick={scrollToCatalog}>
              Shop all gifts
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => document.getElementById('makers-heading')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Meet the makers
            </Button>
          </div>

          <dl className="hero-stats">
            <div>
              <dt>Makers</dt>
              <dd>{loading ? '—' : makerCount}</dd>
            </div>
            <div>
              <dt>Pieces</dt>
              <dd>{loading ? '—' : products.length}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>Worldwide</dd>
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

      <section className="budget" aria-labelledby="budget-heading">
        <div className="section-head">
          <div>
            <p className="eyebrow">Shop by budget</p>
            <h2 className="section-title" id="budget-heading">
              Find something in range
            </h2>
          </div>
        </div>

        <div className="budget-grid">
          {PRICE_BUCKETS.map((bucket) => {
            const count = products.filter((product) => matchesBucket(product, bucket)).length;
            return (
              <button
                key={bucket.id}
                type="button"
                className="budget-card"
                onClick={() => {
                  setFilters((current) => ({
                    ...current,
                    priceBucket: current.priceBucket === bucket.id ? null : bucket.id,
                  }));
                  scrollToCatalog();
                }}
              >
                <span className="budget-label">{bucket.label}</span>
                <span className="budget-count">
                  {loading ? '—' : `${count} ${pluralize(count, 'gift')}`}
                </span>
                <Icon name="arrow-right" size={17} className="budget-arrow" />
              </button>
            );
          })}
        </div>
      </section>

      {!loading && <SellerRail sellers={sellers} products={products} />}

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
          onChange={(next) => setFilters((current) => ({ ...current, ...next }))}
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
            title="We couldn't load the catalogue"
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
              <ProductCard
                key={product.product_id}
                product={product}
                sellerName={product.seller_id ? sellerNames.get(product.seller_id) : undefined}
                eagerImage={index < 4}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
