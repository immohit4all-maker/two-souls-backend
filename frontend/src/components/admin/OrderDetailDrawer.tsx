import { formatCurrency, formatDateTime, toNumber } from '../../lib/format';
import { Badge, StatusBadge } from '../ui/Badge';
import { Drawer } from '../ui/Drawer';
import { ProductImage } from '../storefront/ProductImage';
import type { Order } from '../../types';

export interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
}

/**
 * Full order record: line items, totals and the shipping address.
 *
 * The old orders table showed only a customer name and a total, so there was no way to see what
 * anyone had actually bought without going to the database.
 */
export function OrderDetailDrawer({ order, onClose }: OrderDetailDrawerProps) {
  const currency = order?.currency ?? 'USD';
  const items = order?.items ?? [];

  return (
    <Drawer
      open={order !== null}
      onClose={onClose}
      title={order?.order_number ?? 'Order'}
      description={order ? formatDateTime(order.placed_at ?? order.created_at) : undefined}
      width="480px"
    >
      {order && (
        <div className="order-detail">
          <div className="order-status-row">
            <StatusBadge status={order.status} fallback="PENDING" />
            <Badge tone={order.payment_status === 'PAID' ? 'success' : 'warning'}>
              Payment: {order.payment_status ?? 'PENDING'}
            </Badge>
          </div>

          <section>
            <p className="eyebrow">Customer</p>
            <p className="order-strong">
              {order.shipping_address?.full_name ?? order.customer_name ?? 'Guest'}
            </p>
            {(order.customer_email ?? order.shipping_address?.email) && (
              <p className="cell-sub">{order.customer_email ?? order.shipping_address?.email}</p>
            )}
            {order.shipping_address?.phone && (
              <p className="cell-sub">{order.shipping_address.phone}</p>
            )}
          </section>

          {order.shipping_address && (
            <section>
              <p className="eyebrow">Shipping to</p>
              <address className="order-address">
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
            </section>
          )}

          <section>
            <p className="eyebrow">
              Items {items.length > 0 && <span className="order-count">({items.length})</span>}
            </p>

            {items.length === 0 ? (
              <p className="cell-sub">No line items were recorded on this order.</p>
            ) : (
              <ul className="order-items">
                {items.map((item) => (
                  <li key={`${item.product_id}-${item.sku ?? ''}`} className="order-item">
                    <span className="order-item-media">
                      <ProductImage src={item.imageUrl} alt="" />
                    </span>
                    <div className="order-item-body">
                      <p className="cell-title">{item.title}</p>
                      <p className="cell-sub">
                        {toNumber(item.quantity)} × {formatCurrency(item.unit_price, currency)}
                        {item.sku && <span className="text-mono"> · {item.sku}</span>}
                      </p>
                    </div>
                    <span className="order-item-total">
                      {formatCurrency(item.line_total, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <dl className="summary-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(order.subtotal, currency)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>
                {toNumber(order.shipping) === 0 ? 'Free' : formatCurrency(order.shipping, currency)}
              </dd>
            </div>
            <div className="summary-grand">
              <dt>Total</dt>
              <dd>{formatCurrency(order.total_amount, currency)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Drawer>
  );
}
