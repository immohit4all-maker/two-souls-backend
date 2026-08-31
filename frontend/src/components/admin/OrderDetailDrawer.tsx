import { useAdminData } from '../../context/admin-data-context';
import { dealerContact, dealerLabel } from '../../lib/dealer';
import { DEFAULT_CURRENCY, formatCurrency, formatDateTime, toNumber } from '../../lib/format';
import { Badge, StatusBadge } from '../ui/Badge';
import { Drawer } from '../ui/Drawer';
import { Icon } from '../ui/Icon';
import { ProductImage } from '../storefront/ProductImage';
import type { Dealer, Order, OrderItem } from '../../types';

export interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
}

interface SourcingGroup {
  dealer: Dealer | null;
  items: OrderItem[];
}

/**
 * Full order record: line items, totals, shipping address and — the part that drives the actual
 * workflow — which dealer each item has to be ordered from.
 *
 * The old orders table showed only a customer name and a total, so there was no way to see what
 * anyone had bought, let alone who to buy it from.
 */
export function OrderDetailDrawer({ order, onClose }: OrderDetailDrawerProps) {
  const { dealers, products } = useAdminData();

  const currency = order?.currency ?? DEFAULT_CURRENCY;
  const items = order?.items ?? [];

  /**
   * Resolve each line to a dealer and group.
   *
   * The line item carries its own `seller_id` snapshot, but fall back to the product record for
   * older orders written before that was captured.
   */
  const groups: SourcingGroup[] = [];
  for (const item of items) {
    const dealerId =
      item.seller_id ??
      products.find((product) => product.product_id === item.product_id)?.seller_id;
    const dealer = dealerId ? (dealers.find((d) => d.seller_id === dealerId) ?? null) : null;

    const existing = groups.find((group) => group.dealer?.seller_id === dealer?.seller_id);
    if (existing) existing.items.push(item);
    else groups.push({ dealer, items: [item] });
  }

  return (
    <Drawer
      open={order !== null}
      onClose={onClose}
      title={order?.order_number ?? 'Order'}
      description={order ? formatDateTime(order.placed_at ?? order.created_at) : undefined}
      width="520px"
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
              <p className="eyebrow">Deliver to</p>
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
              Source from {items.length > 0 && <span className="order-count">({items.length} items)</span>}
            </p>

            {items.length === 0 ? (
              <p className="cell-sub">No line items were recorded on this order.</p>
            ) : (
              <div className="sourcing">
                {groups.map((group) => {
                  const contact = group.dealer ? dealerContact(group.dealer) : null;
                  return (
                  <div key={group.dealer?.seller_id ?? 'unassigned'} className="sourcing-group">
                    <div className="sourcing-head">
                      <span className="sourcing-dealer">
                        <Icon name="store" size={15} />
                        {group.dealer ? dealerLabel(group.dealer) : 'No dealer assigned'}
                      </span>
                      {/* Distinguish "no dealer on this item" from "dealer has no contact
                          details" — every field on a dealer record is optional. */}
                      {!group.dealer ? (
                        <span className="sourcing-warn">
                          <Icon name="alert" size={14} />
                          Assign a dealer
                        </span>
                      ) : contact ? (
                        <a
                          className="sourcing-contact"
                          href={`${contact.kind === 'email' ? 'mailto' : 'tel'}:${contact.value}`}
                        >
                          <Icon name={contact.kind === 'email' ? 'mail' : 'phone'} size={14} />
                          {contact.value}
                        </a>
                      ) : (
                        <span className="cell-sub">No contact details</span>
                      )}
                    </div>

                    <ul className="order-items">
                      {group.items.map((item) => (
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
                  </div>
                  );
                })}
              </div>
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
              <dt>Customer pays</dt>
              <dd>{formatCurrency(order.total_amount, currency)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Drawer>
  );
}
