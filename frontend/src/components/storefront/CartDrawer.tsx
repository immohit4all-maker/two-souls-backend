import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/cart-context';
import { formatCurrency, pluralize } from '../../lib/format';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { ProductImage } from './ProductImage';
import { QuantityStepper } from './QuantityStepper';

export function CartDrawer() {
  const { lines, count, subtotal, isOpen, closeCart, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const goToCheckout = () => {
    closeCart();
    void navigate('/checkout');
  };

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      title="Your bag"
      description={count > 0 ? `${count} ${pluralize(count, 'item')}` : undefined}
      width="440px"
      footer={
        lines.length > 0 ? (
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <p className="cart-summary-note">Shipping is calculated at checkout.</p>
            <Button size="lg" fullWidth iconRight="arrow-right" onClick={goToCheckout}>
              Checkout
            </Button>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <EmptyState
          icon="bag"
          compact
          title="Your bag is empty"
          description="Once you find something you like, it will show up here."
          action={
            <Button variant="secondary" onClick={closeCart}>
              Keep browsing
            </Button>
          }
        />
      ) : (
        <ul className="cart-lines">
          {lines.map((line) => (
            <li key={line.product_id} className="cart-line">
              <div className="cart-line-media">
                <ProductImage src={line.imageUrl} alt={line.title} />
              </div>

              <div className="cart-line-body">
                <p className="cart-line-title">{line.title}</p>
                <p className="cart-line-price">
                  {formatCurrency(line.unit_price)}
                  {line.quantity > 1 && ` each`}
                </p>

                <div className="cart-line-controls">
                  <QuantityStepper
                    size="sm"
                    value={line.quantity}
                    max={line.stock_quantity}
                    onChange={(next) => setQuantity(line.product_id, next)}
                  />
                  <button
                    type="button"
                    className="cart-line-remove"
                    onClick={() => removeItem(line.product_id)}
                    aria-label={`Remove ${line.title} from bag`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>

              <p className="cart-line-total">{formatCurrency(line.unit_price * line.quantity)}</p>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
