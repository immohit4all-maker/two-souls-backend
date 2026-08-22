import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/cart-context';
import { useToast } from '../ui/toast-context';
import { createOrder } from '../../services/orderService';
import { errorMessage } from '../../lib/apiClient';
import { formatCurrency, generateOrderNumber, money, pluralize } from '../../lib/format';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Field, TextInput } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { ProductImage } from './ProductImage';
import type { OrderInput, OrderItem } from '../../types';

/**
 * Placeholder shipping policy. There is no carrier integration yet, so this is a single flat
 * rate with a free-over threshold — change these two numbers when real rates are available.
 */
const FREE_SHIPPING_THRESHOLD = 75;
const FLAT_SHIPPING = 6.95;

interface CheckoutForm {
  full_name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const EMPTY_FORM: CheckoutForm = {
  full_name: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
};

type FormErrors = Partial<Record<keyof CheckoutForm, string>>;

const REQUIRED_FIELDS: Array<{ key: keyof CheckoutForm; label: string }> = [
  { key: 'full_name', label: 'Full name' },
  { key: 'email', label: 'Email' },
  { key: 'line1', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'postal_code', label: 'Postcode' },
  { key: 'country', label: 'Country' },
];

function validate(form: CheckoutForm): FormErrors {
  const errors: FormErrors = {};

  REQUIRED_FIELDS.forEach(({ key, label }) => {
    if (!form[key].trim()) errors[key] = `${label} is required.`;
  });

  // Deliberately permissive: enough to catch a typo, not enough to reject a valid address.
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

export function Checkout() {
  const { lines, count, subtotal, clear } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING;
  const total = subtotal + shipping;

  const update = (key: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    // Clear the error as soon as the field is touched, rather than waiting for resubmit.
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  if (lines.length === 0) {
    return (
      <EmptyState
        icon="bag"
        title="There's nothing to check out"
        description="Add a gift to your bag and it will show up here."
        action={
          <Link to="/" className="btn btn-primary btn-md">
            Browse gifts
          </Link>
        }
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Check the form', 'Some required details are missing.');
      // Move focus to the first problem so keyboard and screen-reader users are not stranded.
      const firstKey = REQUIRED_FIELDS.find((field) => found[field.key])?.key;
      if (firstKey) document.querySelector<HTMLInputElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    const orderNumber = generateOrderNumber();

    const items: OrderItem[] = lines.map((line) => ({
      product_id: line.product_id,
      title: line.title,
      sku: line.sku,
      seller_id: line.seller_id,
      imageUrl: line.imageUrl,
      // Money and counts go over as strings — see the `Numeric` note in src/types.
      unit_price: money(line.unit_price),
      quantity: String(line.quantity),
      line_total: money(line.unit_price * line.quantity),
    }));

    const payload: OrderInput = {
      order_number: orderNumber,
      customer_id: form.email.trim().toLowerCase(),
      customer_name: form.full_name.trim(),
      customer_email: form.email.trim(),
      items,
      shipping_address: {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim() || undefined,
        postal_code: form.postal_code.trim(),
        country: form.country.trim(),
      },
      subtotal: money(subtotal),
      shipping: money(shipping),
      total_amount: money(total),
      currency: 'USD',
      status: 'PENDING',
      payment_status: 'PENDING',
      placed_at: new Date().toISOString(),
    };

    try {
      const created = await createOrder(payload);
      clear();
      toast.success('Order placed', `Reference ${orderNumber}`);
      void navigate(`/order/${orderNumber}`, {
        replace: true,
        state: { order: created ?? { ...payload, order_id: orderNumber } },
      });
    } catch (caught) {
      // Leave the bag intact so the shopper can retry without rebuilding it.
      toast.error('We could not place your order', errorMessage(caught));
      setSubmitting(false);
    }
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Shop</Link>
        <Icon name="chevron-right" size={14} />
        <span>Checkout</span>
      </nav>

      <div className="checkout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <section className="checkout-section">
            <h2 className="checkout-heading">Contact</h2>
            <div className="form-grid">
              <Field label="Full name" required error={errors.full_name} className="field-full">
                <TextInput
                  name="full_name"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(event) => update('full_name', event.target.value)}
                />
              </Field>

              <Field label="Email" required error={errors.email}>
                <TextInput
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                />
              </Field>

              <Field label="Phone" hint="Optional — for delivery updates" error={errors.phone}>
                <TextInput
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-heading">Shipping address</h2>
            <div className="form-grid">
              <Field label="Address" required error={errors.line1} className="field-full">
                <TextInput
                  name="line1"
                  autoComplete="address-line1"
                  value={form.line1}
                  onChange={(event) => update('line1', event.target.value)}
                />
              </Field>

              <Field label="Apartment, suite, etc." error={errors.line2} className="field-full">
                <TextInput
                  name="line2"
                  autoComplete="address-line2"
                  value={form.line2}
                  onChange={(event) => update('line2', event.target.value)}
                />
              </Field>

              <Field label="City" required error={errors.city}>
                <TextInput
                  name="city"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                />
              </Field>

              <Field label="State / region" error={errors.state}>
                <TextInput
                  name="state"
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={(event) => update('state', event.target.value)}
                />
              </Field>

              <Field label="Postcode" required error={errors.postal_code}>
                <TextInput
                  name="postal_code"
                  autoComplete="postal-code"
                  value={form.postal_code}
                  onChange={(event) => update('postal_code', event.target.value)}
                />
              </Field>

              <Field label="Country" required error={errors.country}>
                <TextInput
                  name="country"
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(event) => update('country', event.target.value)}
                />
              </Field>
            </div>
          </section>

          <div className="checkout-submit">
            <Button type="submit" size="lg" fullWidth loading={submitting} iconRight="arrow-right">
              {submitting ? 'Placing your order…' : `Place order · ${formatCurrency(total)}`}
            </Button>
            <p className="checkout-note">
              <Icon name="lock" size={14} />
              No payment is taken yet — the maker will confirm your order by email.
            </p>
          </div>
        </form>

        <aside className="checkout-summary" aria-label="Order summary">
          <h2 className="checkout-heading">
            Your order
            <span className="checkout-count">
              {count} {pluralize(count, 'item')}
            </span>
          </h2>

          <ul className="summary-lines">
            {lines.map((line) => (
              <li key={line.product_id} className="summary-line">
                <div className="summary-media">
                  <ProductImage src={line.imageUrl} alt={line.title} />
                  <span className="summary-qty" aria-hidden="true">
                    {line.quantity}
                  </span>
                </div>
                <div className="summary-body">
                  <p className="summary-title">{line.title}</p>
                  <p className="summary-unit">{formatCurrency(line.unit_price)} each</p>
                </div>
                <p className="summary-amount">{formatCurrency(line.unit_price * line.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className="summary-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</dd>
            </div>
            <div className="summary-grand">
              <dt>Total</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>

          {shipping > 0 && (
            <p className="summary-hint">
              Spend {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
