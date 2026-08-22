import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../../context/catalog-context';
import { useCart } from '../../context/cart-context';
import { useToast } from '../ui/toast-context';
import { formatCurrency, initials } from '../../lib/format';
import { isLowStock, isSoldOut, stockOf } from '../../lib/product';
import { toggleSaved, useSavedIds } from '../../lib/savedItems';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Skeleton } from '../ui/Skeleton';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';
import { QuantityStepper } from './QuantityStepper';

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { products, sellers, loading, error, reload } = useCatalog();
  const { addItem, openCart } = useCart();
  const toast = useToast();
  const savedIds = useSavedIds();
  // Navigating between two product pages reuses this component, so the quantity is tagged with
  // the product it belongs to and falls back to 1 for any other — no reset effect required.
  const [chosen, setChosen] = useState<{ id: string | undefined; value: number }>({
    id: productId,
    value: 1,
  });
  const quantity = chosen.id === productId ? chosen.value : 1;
  const setQuantity = (value: number) => setChosen({ id: productId, value });

  if (loading) {
    return (
      <div className="pdp">
        <Skeleton height="clamp(320px, 46vw, 560px)" radius="var(--radius-xl)" />
        <div className="pdp-info">
          <Skeleton height="0.8rem" width="30%" />
          <Skeleton height="2.2rem" width="80%" />
          <Skeleton height="1.4rem" width="25%" />
          <Skeleton height="5rem" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        tone="error"
        title="We couldn't load this product"
        description={error}
        action={
          <Button variant="secondary" iconLeft="refresh" onClick={() => void reload()}>
            Try again
          </Button>
        }
      />
    );
  }

  const product = products.find((candidate) => candidate.product_id === productId);

  if (!product) {
    return (
      <EmptyState
        icon="package"
        title="This gift is no longer available"
        description="It may have sold out or been taken down by the maker."
        action={
          <Link to="/" className="btn btn-primary btn-md">
            Back to the shop
          </Link>
        }
      />
    );
  }

  const seller = sellers.find((candidate) => candidate.seller_id === product.seller_id);
  const soldOut = isSoldOut(product);
  const stock = stockOf(product);
  const saved = savedIds.includes(product.product_id);

  const related = products
    .filter(
      (candidate) =>
        candidate.product_id !== product.product_id && candidate.category === product.category,
    )
    .slice(0, 4);

  const handleAdd = () => {
    addItem(product, quantity);
    toast.success('Added to your bag', `${quantity} × ${product.title}`);
    openCart();
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Shop</Link>
        <Icon name="chevron-right" size={14} />
        {product.category ? <span>{product.category}</span> : <span>Gift</span>}
      </nav>

      <div className="pdp">
        <div className="pdp-media">
          <ProductImage src={product.imageUrl} alt={product.title} eager className="pdp-image" />
          {soldOut && <span className="product-flag product-flag-muted pdp-flag">Sold out</span>}
        </div>

        <div className="pdp-info">
          {product.category && <Badge tone="accent">{product.category}</Badge>}

          <h1 className="pdp-title">{product.title}</h1>

          <p className="pdp-price">{formatCurrency(product.sell_price)}</p>

          {seller && (
            <div className="pdp-seller">
              <span className="maker-avatar maker-avatar-sm" aria-hidden="true">
                {initials(seller.store_name)}
              </span>
              <div>
                <p className="pdp-seller-name">{seller.store_name}</p>
                <p className="pdp-seller-meta">{seller.business_name || 'Independent creator'}</p>
              </div>
            </div>
          )}

          {product.description && <p className="pdp-description">{product.description}</p>}

          <dl className="pdp-facts">
            {product.sku && (
              <div>
                <dt>SKU</dt>
                <dd className="text-mono">{product.sku}</dd>
              </div>
            )}
            <div>
              <dt>Availability</dt>
              <dd>
                {soldOut ? (
                  <span className="pdp-oos">Sold out</span>
                ) : isLowStock(product) ? (
                  <span className="pdp-low">Only {stock} left</span>
                ) : (
                  <span className="pdp-in">In stock</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="pdp-actions">
            {!soldOut && (
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={stock} />
            )}

            <Button size="lg" iconLeft="bag" onClick={handleAdd} disabled={soldOut} fullWidth>
              {soldOut ? 'Sold out' : 'Add to bag'}
            </Button>

            <Button
              size="lg"
              variant="secondary"
              iconOnly
              iconLeft="heart"
              aria-label={saved ? 'Remove from saved' : 'Save for later'}
              aria-pressed={saved}
              className={saved ? 'is-saved' : undefined}
              onClick={() => toggleSaved(product.product_id)}
            />
          </div>

          <ul className="pdp-reassure">
            <li>
              <Icon name="truck" size={16} /> Packed and posted by the maker
            </li>
            <li>
              <Icon name="lock" size={16} /> Secure checkout
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related-heading">
          <div className="section-head">
            <div>
              <p className="eyebrow">You might also like</p>
              <h2 className="section-title" id="related-heading">
                More from {product.category}
              </h2>
            </div>
          </div>
          <div className="product-grid">
            {related.map((candidate) => (
              <ProductCard
                key={candidate.product_id}
                product={candidate}
                sellerName={
                  sellers.find((entry) => entry.seller_id === candidate.seller_id)?.store_name
                }
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
