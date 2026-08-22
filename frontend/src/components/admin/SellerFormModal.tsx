import { useState } from 'react';
import { Button } from '../ui/Button';
import { Field, SelectInput, TextInput } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { SELLER_STATUSES } from '../../types';
import type { Seller, SellerInput, SellerStatus } from '../../types';

interface SellerForm {
  store_name: string;
  business_name: string;
  name: string;
  email: string;
  phone_number: string;
  tax_id: string;
  commission_rate: string;
  status: SellerStatus;
}

const EMPTY: SellerForm = {
  store_name: '',
  business_name: '',
  name: '',
  email: '',
  phone_number: '',
  tax_id: '',
  commission_rate: '10',
  status: 'ACTIVE',
};

type Errors = Partial<Record<keyof SellerForm, string>>;

function toForm(seller: Seller): SellerForm {
  return {
    store_name: seller.store_name ?? '',
    business_name: seller.business_name ?? '',
    name: seller.name ?? '',
    email: seller.email ?? '',
    phone_number: seller.phone_number ?? '',
    tax_id: seller.tax_id ?? '',
    commission_rate: seller.commission_rate === undefined ? '10' : String(seller.commission_rate),
    status: seller.status ?? 'ACTIVE',
  };
}

function validate(form: SellerForm): Errors {
  const errors: Errors = {};
  if (!form.store_name.trim()) errors.store_name = 'Store name is required.';
  if (!form.business_name.trim()) errors.business_name = 'Business name is required.';
  if (!form.name.trim()) errors.name = 'Contact name is required.';

  if (!form.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
    errors.email = 'Enter a valid email address.';

  const rate = Number.parseFloat(form.commission_rate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    errors.commission_rate = 'Enter a rate between 0 and 100.';
  }

  return errors;
}

export interface SellerFormModalProps {
  initial: Seller | null;
  onClose: () => void;
  /** Resolves on success; rejects to keep the dialog open so the operator can retry. */
  onSave: (input: SellerInput) => Promise<void>;
}

/**
 * Mounted only while open, so the form state is seeded once from `initial` and thrown away on
 * close. The old modal kept itself mounted and reset via an effect keyed on `initialData`,
 * which meant opening "Add seller" twice in a row — where `initialData` stays null both times —
 * left the previous entry's values in the fields.
 */
export function SellerFormModal({ initial, onClose, onSave }: SellerFormModalProps) {
  const [form, setForm] = useState<SellerForm>(() => (initial ? toForm(initial) : EMPTY));
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof SellerForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSave({
        ...(initial?.seller_id ? { seller_id: initial.seller_id } : {}),
        ...(initial?.created_at ? { created_at: initial.created_at } : {}),
        store_name: form.store_name.trim(),
        business_name: form.business_name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim() || undefined,
        tax_id: form.tax_id.trim() || undefined,
        // Sent as a string: a JSON float breaks this backend's DynamoDB write.
        commission_rate: form.commission_rate.trim(),
        status: form.status,
      });
    } catch {
      // The manager surfaces the error as a toast; keep the dialog open for a retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={submitting ? () => undefined : onClose}
      title={initial ? 'Edit seller' : 'Add a seller'}
      description={initial ? initial.store_name : 'Register a new merchant partner.'}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {initial ? 'Save changes' : 'Add seller'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Store name" required error={errors.store_name}>
          <TextInput value={form.store_name} onChange={(e) => update('store_name', e.target.value)} />
        </Field>

        <Field label="Business name" required error={errors.business_name}>
          <TextInput
            value={form.business_name}
            onChange={(e) => update('business_name', e.target.value)}
          />
        </Field>

        <Field label="Contact name" required error={errors.name}>
          <TextInput value={form.name} onChange={(e) => update('name', e.target.value)} />
        </Field>

        <Field label="Email" required error={errors.email}>
          <TextInput type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </Field>

        <Field label="Phone number" error={errors.phone_number}>
          <TextInput
            type="tel"
            value={form.phone_number}
            onChange={(e) => update('phone_number', e.target.value)}
          />
        </Field>

        <Field label="Tax ID / GSTIN" error={errors.tax_id}>
          <TextInput value={form.tax_id} onChange={(e) => update('tax_id', e.target.value)} />
        </Field>

        <Field label="Commission rate (%)" required error={errors.commission_rate}>
          <TextInput
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.commission_rate}
            onChange={(e) => update('commission_rate', e.target.value)}
          />
        </Field>

        <Field label="Status" error={errors.status}>
          <SelectInput
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
          >
            {SELLER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
    </Modal>
  );
}
