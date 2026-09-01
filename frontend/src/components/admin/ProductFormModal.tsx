import { useState } from 'react';
import { errorMessage } from '../../lib/apiClient';
import { toNumber } from '../../lib/format';
import { PRODUCT_CATEGORIES, sourcingOf } from '../../lib/product';
import { uploadProductImage } from '../../services/productService';
import { Button } from '../ui/Button';
import { Field, SelectInput, TextArea, TextInput } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { SourcingEditor } from './SourcingEditor';
import type { SourcingRow } from './SourcingEditor';
import { TagPicker } from './TagPicker';
import { PRODUCT_STATUSES } from '../../types';
import type { Dealer, Product, ProductInput, ProductSourcing, ProductStatus } from '../../types';

interface ProductForm {
  title: string;
  sku: string;
  category: string;
  sell_price: string;
  stock_quantity: string;
  status: ProductStatus;
  description: string;
  imageUrl: string;
  tags: string[];
  sourcing: SourcingRow[];
}

/** Fields edited as plain strings — `tags` and `sourcing` have their own setters. */
type TextField = Exclude<keyof ProductForm, 'tags' | 'sourcing'>;

const EMPTY: ProductForm = {
  title: '',
  sku: '',
  category: '',
  sell_price: '',
  stock_quantity: '',
  status: 'PUBLISHED',
  description: '',
  imageUrl: '',
  tags: [],
  sourcing: [],
};

type Errors = Partial<Record<TextField | 'image' | 'sourcing', string>>;

function toForm(product: Product): ProductForm {
  return {
    title: product.title ?? '',
    sku: product.sku ?? '',
    category: product.category ?? '',
    sell_price: product.sell_price === undefined ? '' : String(product.sell_price),
    stock_quantity: product.stock_quantity === undefined ? '' : String(product.stock_quantity),
    status: product.status ?? 'PUBLISHED',
    description: product.description ?? '',
    imageUrl: product.imageUrl ?? '',
    tags: Array.isArray(product.tags) ? product.tags : [],
    sourcing: sourcingOf(product).map((entry) => ({
      seller_id: entry.seller_id,
      buy_price: entry.buy_price === undefined ? '' : String(entry.buy_price),
    })),
  };
}

function positiveNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function validate(form: ProductForm): Errors {
  const errors: Errors = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.category.trim()) errors.category = 'Pick a category.';

  if (positiveNumber(form.sell_price) === null) errors.sell_price = 'Enter a price of 0 or more.';
  if (positiveNumber(form.stock_quantity) === null) errors.stock_quantity = 'Enter a whole number.';

  return errors;
}

/** A sourcing row is all-or-nothing: a dealer without a cost is not usable. */
function validateSourcing(rows: SourcingRow[]): Array<string | undefined> {
  return rows.map((row) => {
    if (!row.seller_id) return 'Choose a dealer.';
    if (positiveNumber(row.buy_price) === null) return 'Enter a cost of 0 or more.';
    return undefined;
  });
}

export interface ProductFormModalProps {
  initial: Product | null;
  dealers: Dealer[];
  onClose: () => void;
  onSave: (input: ProductInput) => Promise<void>;
}

/** Mounted only while open — see the note on DealerFormModal for why. */
export function ProductFormModal({ initial, dealers, onClose, onSave }: ProductFormModalProps) {
  const [form, setForm] = useState<ProductForm>(() => (initial ? toForm(initial) : EMPTY));
  const [errors, setErrors] = useState<Errors>({});
  const [rowErrors, setRowErrors] = useState<Array<string | undefined>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = (key: TextField, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  /**
   * A product saved under a category that is no longer on the list keeps it as an extra option,
   * so opening an old record to edit the price does not quietly reassign its category.
   */
  const categoryOptions: string[] = [...PRODUCT_CATEGORIES];
  if (form.category && !categoryOptions.includes(form.category)) {
    categoryOptions.push(form.category);
  }

  /**
   * Upload happens on file selection rather than on submit, so the operator sees the result
   * before committing. The old modal uploaded inside the submit handler with no pending state,
   * which meant a large image looked like a frozen dialog and could be double-submitted.
   */
  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, image: 'Choose an image file.' }));
      return;
    }
    if (file.size > 5_000_000) {
      setErrors((current) => ({ ...current, image: 'Images must be under 5 MB.' }));
      return;
    }

    setUploading(true);
    setErrors((current) => ({ ...current, image: undefined }));
    try {
      const url = await uploadProductImage(file);
      setForm((current) => ({ ...current, imageUrl: url }));
    } catch (caught) {
      setErrors((current) => ({ ...current, image: errorMessage(caught, 'Upload failed.') }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = validate(form);
    const rows = validateSourcing(form.sourcing);
    setErrors(found);
    setRowErrors(rows);
    if (Object.keys(found).length > 0 || rows.some(Boolean)) return;

    const sourcing: ProductSourcing[] = form.sourcing.map((row) => ({
      seller_id: row.seller_id,
      buy_price: row.buy_price.trim(),
    }));

    // The cheapest dealer is mirrored onto the legacy single-dealer fields, which is what a
    // cart line and an order line item snapshot when a customer buys.
    const primary =
      sourcing.length > 0
        ? sourcing.reduce((best, entry) =>
            toNumber(entry.buy_price) < toNumber(best.buy_price) ? entry : best,
          )
        : undefined;

    setSubmitting(true);
    try {
      await onSave({
        ...(initial?.product_id ? { product_id: initial.product_id } : {}),
        ...(initial?.created_at ? { created_at: initial.created_at } : {}),
        title: form.title.trim(),
        sku: form.sku.trim() || undefined,
        category: form.category.trim(),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
        sourcing: sourcing.length > 0 ? sourcing : undefined,
        seller_id: primary?.seller_id,
        buy_price: primary?.buy_price,
        // Numbers travel as strings — see the `Numeric` note in src/types.
        sell_price: form.sell_price.trim(),
        stock_quantity: form.stock_quantity.trim(),
        status: form.status,
      });
    } catch {
      // Surfaced as a toast by the manager; keep the dialog open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={submitting ? () => undefined : onClose}
      title={initial ? 'Edit product' : 'Add a product'}
      description={initial ? initial.title : 'List a new item in the catalogue.'}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={uploading}>
            {initial ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Title" required error={errors.title} className="field-full">
          <TextInput value={form.title} onChange={(e) => update('title', e.target.value)} />
        </Field>

        <Field label="Category" required error={errors.category}>
          <SelectInput value={form.category} onChange={(e) => update('category', e.target.value)}>
            <option value="">Choose a category…</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="SKU" error={errors.sku}>
          <TextInput
            value={form.sku}
            onChange={(e) => update('sku', e.target.value)}
            placeholder="e.g. GS-001"
          />
        </Field>

        <Field label="Retail price" required error={errors.sell_price} hint="What the shopper pays">
          <TextInput
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={form.sell_price}
            onChange={(e) => update('sell_price', e.target.value)}
          />
        </Field>

        <Field label="Stock quantity" required error={errors.stock_quantity}>
          <TextInput
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.stock_quantity}
            onChange={(e) => update('stock_quantity', e.target.value)}
          />
        </Field>

        <Field label="Status" error={errors.status}>
          <SelectInput value={form.status} onChange={(e) => update('status', e.target.value)}>
            {PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field
          label="Sourced from"
          error={errors.sourcing}
          hint="Every dealer who can supply this item, and what each charges you. Private — never shown to customers."
          className="field-full"
        >
          <SourcingEditor
            rows={form.sourcing}
            dealers={dealers}
            rowErrors={rowErrors}
            onChange={(sourcing) => {
              setForm((current) => ({ ...current, sourcing }));
              setRowErrors([]);
            }}
          />
        </Field>

        <Field label="Description" error={errors.description} className="field-full">
          <TextArea
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </Field>

        <Field
          label="Gift finder tags"
          hint="Where this shows up when shoppers browse by occasion, festival or recipient"
          className="field-full"
        >
          <TagPicker value={form.tags} onChange={(tags) => setForm((c) => ({ ...c, tags }))} />
        </Field>

        <Field label="Image" error={errors.image} className="field-full">
          <div className="image-field">
            {form.imageUrl ? (
              <img className="image-preview" src={form.imageUrl} alt="" />
            ) : (
              <span className="image-preview image-preview-empty">
                <Icon name="image" size={20} />
              </span>
            )}

            <div className="image-field-controls">
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
              {uploading && <p className="field-hint">Uploading…</p>}
              {form.imageUrl && !uploading && (
                <button
                  type="button"
                  className="image-remove"
                  onClick={() => update('imageUrl', '')}
                >
                  Remove image
                </button>
              )}
            </div>
          </div>
        </Field>
      </div>
    </Modal>
  );
}
