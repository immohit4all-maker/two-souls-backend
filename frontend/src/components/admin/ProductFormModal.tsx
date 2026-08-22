import { useState } from 'react';
import { errorMessage } from '../../lib/apiClient';
import { dealerLabel } from '../../lib/dealer';
import { uploadProductImage } from '../../services/productService';
import { Button } from '../ui/Button';
import { Field, SelectInput, TextArea, TextInput } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { PRODUCT_STATUSES } from '../../types';
import type { Dealer, Product, ProductInput, ProductStatus } from '../../types';

interface ProductForm {
  title: string;
  sku: string;
  category: string;
  buy_price: string;
  sell_price: string;
  stock_quantity: string;
  status: ProductStatus;
  description: string;
  seller_id: string;
  imageUrl: string;
}

const EMPTY: ProductForm = {
  title: '',
  sku: '',
  category: '',
  buy_price: '',
  sell_price: '',
  stock_quantity: '',
  status: 'PUBLISHED',
  description: '',
  seller_id: '',
  imageUrl: '',
};

type Errors = Partial<Record<keyof ProductForm | 'image', string>>;

function toForm(product: Product): ProductForm {
  return {
    title: product.title ?? '',
    sku: product.sku ?? '',
    category: product.category ?? '',
    buy_price: product.buy_price === undefined ? '' : String(product.buy_price),
    sell_price: product.sell_price === undefined ? '' : String(product.sell_price),
    stock_quantity: product.stock_quantity === undefined ? '' : String(product.stock_quantity),
    status: product.status ?? 'PUBLISHED',
    description: product.description ?? '',
    seller_id: product.seller_id ?? '',
    imageUrl: product.imageUrl ?? '',
  };
}

function positiveNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function validate(form: ProductForm): Errors {
  const errors: Errors = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.category.trim()) errors.category = 'Category is required.';

  if (positiveNumber(form.buy_price) === null) errors.buy_price = 'Enter a cost of 0 or more.';
  if (positiveNumber(form.sell_price) === null) errors.sell_price = 'Enter a price of 0 or more.';
  if (positiveNumber(form.stock_quantity) === null) errors.stock_quantity = 'Enter a whole number.';

  return errors;
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
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = (key: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

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
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSave({
        ...(initial?.product_id ? { product_id: initial.product_id } : {}),
        ...(initial?.created_at ? { created_at: initial.created_at } : {}),
        title: form.title.trim(),
        sku: form.sku.trim() || undefined,
        category: form.category.trim(),
        description: form.description.trim() || undefined,
        seller_id: form.seller_id || undefined,
        imageUrl: form.imageUrl || undefined,
        // Numbers travel as strings — see the `Numeric` note in src/types.
        buy_price: form.buy_price.trim(),
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
          <TextInput
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            placeholder="e.g. Ceramics"
          />
        </Field>

        <Field label="SKU" error={errors.sku}>
          <TextInput
            value={form.sku}
            onChange={(e) => update('sku', e.target.value)}
            placeholder="e.g. MUG-001"
          />
        </Field>

        <Field label="Cost price" required error={errors.buy_price} hint="What you pay the dealer">
          <TextInput
            type="number"
            step="0.01"
            min="0"
            value={form.buy_price}
            onChange={(e) => update('buy_price', e.target.value)}
          />
        </Field>

        <Field label="Retail price" required error={errors.sell_price} hint="What the shopper pays">
          <TextInput
            type="number"
            step="0.01"
            min="0"
            value={form.sell_price}
            onChange={(e) => update('sell_price', e.target.value)}
          />
        </Field>

        <Field label="Stock quantity" required error={errors.stock_quantity}>
          <TextInput
            type="number"
            min="0"
            step="1"
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
          error={errors.seller_id}
          hint="Which dealer you order this item from. Private — never shown to customers."
          className="field-full"
        >
          <SelectInput value={form.seller_id} onChange={(e) => update('seller_id', e.target.value)}>
            <option value="">Unassigned</option>
            {dealers.map((dealer) => (
              <option key={dealer.seller_id} value={dealer.seller_id}>
                {dealerLabel(dealer)}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Description" error={errors.description} className="field-full">
          <TextArea
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
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
