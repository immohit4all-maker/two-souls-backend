import { useState } from 'react';
import { dealerLabel } from '../../lib/dealer';
import { Button } from '../ui/Button';
import { Field, SelectInput, TextInput } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { DEALER_STATUSES } from '../../types';
import type { Dealer, DealerInput, DealerStatus } from '../../types';

interface DealerForm {
  store_name: string;
  name: string;
  status: DealerStatus;
  email: string;
  phone_number: string;
  business_name: string;
  tax_id: string;
}

const EMPTY: DealerForm = {
  store_name: '',
  name: '',
  status: 'ACTIVE',
  email: '',
  phone_number: '',
  business_name: '',
  tax_id: '',
};

type Errors = Partial<Record<keyof DealerForm, string>>;

function toForm(dealer: Dealer): DealerForm {
  return {
    store_name: dealer.store_name ?? '',
    name: dealer.name ?? '',
    status: dealer.status ?? 'ACTIVE',
    email: dealer.email ?? '',
    phone_number: dealer.phone_number ?? '',
    business_name: dealer.business_name ?? '',
    tax_id: dealer.tax_id ?? '',
  };
}

/**
 * Nothing is mandatory — a dealer can be saved with as little or as much as you have to hand.
 *
 * The one check left is the shape of an email you did type, since a malformed address silently
 * breaks the mailto link in an order's sourcing list. Leaving it blank is still fine.
 */
function validate(form: DealerForm): Errors {
  const errors: Errors = {};

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address, or leave it blank.';
  }

  return errors;
}

export interface DealerFormModalProps {
  initial: Dealer | null;
  onClose: () => void;
  /** Resolves on success; rejects to keep the dialog open so you can retry. */
  onSave: (input: DealerInput) => Promise<void>;
}

/**
 * Mounted only while open, so the form state is seeded once from `initial` and thrown away on
 * close. The old modal kept itself mounted and reset via an effect keyed on `initialData`,
 * which meant opening "Add" twice in a row — where `initialData` stays null both times — left
 * the previous entry's values in the fields.
 */
export function DealerFormModal({ initial, onClose, onSave }: DealerFormModalProps) {
  const [form, setForm] = useState<DealerForm>(() => (initial ? toForm(initial) : EMPTY));
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof DealerForm, value: string) => {
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
        // The API's PUT replaces the whole record, so start from the existing one. That keeps
        // any stored field this form does not render — such as the retired commission_rate —
        // from being silently wiped on the next edit.
        ...(initial ?? {}),
        // Blank fields are omitted rather than stored as empty strings, so a record only ever
        // holds what was actually filled in.
        store_name: form.store_name.trim() || undefined,
        name: form.name.trim() || undefined,
        status: form.status,
        email: form.email.trim() || undefined,
        phone_number: form.phone_number.trim() || undefined,
        business_name: form.business_name.trim() || undefined,
        tax_id: form.tax_id.trim() || undefined,
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
      title={initial ? 'Edit dealer' : 'Add a dealer'}
      description={
        initial ? dealerLabel(initial) : 'Register a supplier you source stock from. Nothing is required.'
      }
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {initial ? 'Save changes' : 'Add dealer'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field
          label="Dealer name"
          error={errors.store_name}
          hint="How they'll appear everywhere else. Falls back to the business or contact name."
          className="field-full"
        >
          <TextInput
            value={form.store_name}
            onChange={(e) => update('store_name', e.target.value)}
            placeholder="Who you order from"
          />
        </Field>

        <Field label="Contact name" error={errors.name}>
          <TextInput value={form.name} onChange={(e) => update('name', e.target.value)} />
        </Field>

        <Field label="Status" error={errors.status}>
          <SelectInput value={form.status} onChange={(e) => update('status', e.target.value)}>
            {DEALER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field
          label="Email"
          error={errors.email}
          hint="Used to contact them from an order's sourcing list"
        >
          <TextInput type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </Field>

        <Field label="Phone number" error={errors.phone_number}>
          <TextInput
            type="tel"
            value={form.phone_number}
            onChange={(e) => update('phone_number', e.target.value)}
          />
        </Field>

        <Field label="Registered business" error={errors.business_name}>
          <TextInput
            value={form.business_name}
            onChange={(e) => update('business_name', e.target.value)}
          />
        </Field>

        <Field label="Tax ID / GSTIN" error={errors.tax_id}>
          <TextInput value={form.tax_id} onChange={(e) => update('tax_id', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
