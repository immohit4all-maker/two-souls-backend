import { Link, useLocation, useParams } from 'react-router-dom';
import { formatCurrency, toNumber } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { ProductImage } from './ProductImage';
import type { Order } from '../../types';

interface ConfirmationState {
  order?: Order;
}

export function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();

  // The order is handed over in router state by Checkout. There is no GET /orders/{id} endpoint,
  // so a refresh or a shared link cannot recover the detail — fall back to the reference alone.
  const order = (location.state as ConfirmationState | null)?.order;
  const reference = order?.order_number ?? orderNumber ?? '—';

  return (
    <div className="confirmation">
      <span className="confirmation-mark" aria-hidden="true">
        <Icon name="check" size={30} />
      </span>

      <h1 className="confirmation-title">Thank you — your order is in.</h1>
      <p className="confirmation-lead">
        We've sent the details to the maker. You'll hear from them by email to confirm and arrange
        payment.
      </p>

      <p className="confirmation-reference">
        Order reference
        <strong className="text-mono">{reference}</strong>
      </p>

      {order ? (
        <div className="confirmation-card">
          {order.items && order.items.length > 0 && (
            <ul className="summary-lines">
              {order.items.map((item) => (
                <li key={item.product_id} className="summary-line">
                  <div className="summary-media">
                    <ProductImage src={item.imageUrl} alt={item.title} />
                    <span className="summary-qty" aria-hidden="true">
                      {toNumber(item.quantity)}
                    </span>
                  </div>
                  <div className="summary-body">
                    <p className="summary-title">{item.title}</p>
                    <p className="summary-unit">{formatCurrency(item.unit_price)} each</p>
                  </div>
                  <p className="summary-amount">{formatCurrency(item.line_total)}</p>
                </li>
              ))}
            </ul>
          )}

          <dl className="summary-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{toNumber(order.shipping) === 0 ? 'Free' : formatCurrency(order.shipping)}</dd>
            </div>
            <div className="summary-grand">
              <dt>Total</dt>
              <dd>{formatCurrency(order.total_amount, order.currency ?? 'USD')}</dd>
            </div>
          </dl>

          {order.shipping_address && (
            <div className="confirmation-address">
              <p className="eyebrow">Shipping to</p>
              <address>
                {order.shipping_address.full_name}
                <br />
                {order.shipping_address.line1}
                {order.shipping_address.line2 && (
                  <>
                    <br />
                    {order.shipping_address.line2}
                  </>
                )}
                <br />
                {[order.shipping_address.city, order.shipping_address.state]
                  .filter(Boolean)
                  .join(', ')}{' '}
                {order.shipping_address.postal_code}
                <br />
                {order.shipping_address.country}
              </address>
            </div>
          )}
        </div>
      ) : (
        <p className="confirmation-lead">
          Keep this reference handy — quote it in any correspondence about the order.
        </p>
      )}

      <Link to="/" className="btn btn-primary btn-lg confirmation-cta">
        Continue shopping
      </Link>
    </div>
  );
}
