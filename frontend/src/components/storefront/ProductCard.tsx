import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/format';
import { isLowStock, isSoldOut, stockOf } from '../../lib/product';
import { toggleSaved, useSavedIds } from '../../lib/savedItems';
import { useCart } from '../../context/cart-context';
import { useToast } from '../ui/toast-context';
import { Icon } from '../ui/Icon';
import { ProductImage } from './ProductImage';
import type { Product } from '../../types';

export interface ProductCardProps {
  product: Product;
  eagerImage?: boolean;
}

export function ProductCard({ product, eagerImage = false }: ProductCardProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const savedIds = useSavedIds();

  const saved = savedIds.includes(product.product_id);
  const soldOut = isSoldOut(product);
  const lowStock = isLowStock(product);
  const stock = stockOf(product);

  const handleAdd = () => {
    addItem(product, 1);
    toast.success('Added to your bag', product.title);
  };

  return (
    <article className="product-card">
      <div className="product-card-media">
        <ProductImage src={product.imageUrl} alt={product.title} eager={eagerImage} />

        {soldOut && <span className="product-flag product-flag-muted">Sold out</span>}
        {!soldOut && lowStock && (
          <span className="product-flag">Only {stock} left</span>
        )}

        <button
          type="button"
          className="product-save"
          onClick={() => toggleSaved(product.product_id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.title} from saved` : `Save ${product.title}`}
        >
          <Icon name="heart" size={18} filled={saved} />
        </button>

        {!soldOut && (
          <div className="product-quick-add">
            <button type="button" className="product-quick-add-btn" onClick={handleAdd}>
              <Icon name="plus" size={16} />
              Add to bag
            </button>
          </div>
        )}
      </div>

      <div className="product-card-body">
        {product.category && <p className="product-category">{product.category}</p>}

        <h3 className="product-title">
          {/* Stretched link: the ::after in CSS covers the whole card, so the entire tile is
              clickable while the buttons above it stay independently operable. */}
          <Link to={`/product/${encodeURIComponent(product.product_id)}`} className="product-link">
            {product.title}
          </Link>
        </h3>

        <div className="product-card-footer">
          <span className="product-price">{formatCurrency(product.sell_price)}</span>
          {soldOut ? (
            <span className="product-soldout-note">Unavailable</span>
          ) : (
            <button
              type="button"
              className="product-add-inline"
              onClick={handleAdd}
              aria-label={`Add ${product.title} to bag`}
            >
              <Icon name="bag" size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
