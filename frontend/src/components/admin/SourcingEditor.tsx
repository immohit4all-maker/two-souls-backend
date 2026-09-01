import { currencySymbol, formatCurrency, toNumber } from '../../lib/format';
import { dealerLabel } from '../../lib/dealer';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import type { Dealer } from '../../types';

/** A row while it is being edited — cost stays a string so the input can be empty mid-typing. */
export interface SourcingRow {
  seller_id: string;
  buy_price: string;
}

export interface SourcingEditorProps {
  rows: SourcingRow[];
  dealers: Dealer[];
  /** Per-row message, aligned by index with `rows`. */
  rowErrors: Array<string | undefined>;
  onChange: (rows: SourcingRow[]) => void;
}

export function SourcingEditor({ rows, dealers, rowErrors, onChange }: SourcingEditorProps) {
  const symbol = currencySymbol();

  const update = (index: number, patch: Partial<SourcingRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));
  const add = () => onChange([...rows, { seller_id: '', buy_price: '' }]);

  // Costs are only comparable once at least two are filled in.
  const costs = rows.map((row) => toNumber(row.buy_price, Number.NaN)).filter(Number.isFinite);
  const cheapest = costs.length > 1 ? Math.min(...costs) : undefined;

  return (
    <div className="sourcing-editor">
      {rows.length === 0 ? (
        <p className="sourcing-empty">
          No dealers linked yet. Add one to record what this item costs you.
        </p>
      ) : (
        <ul className="sourcing-rows">
          {rows.map((row, index) => {
            // Prevent picking the same dealer twice, while keeping this row's own choice.
            const taken = new Set(rows.filter((_, i) => i !== index).map((other) => other.seller_id));
            const options = dealers.filter(
              (dealer) => !taken.has(dealer.seller_id) || dealer.seller_id === row.seller_id,
            );

            const cost = toNumber(row.buy_price, Number.NaN);
            const isCheapest =
              cheapest !== undefined && Number.isFinite(cost) && cost === cheapest;
            const error = rowErrors[index];

            return (
              <li key={index} className="sourcing-row">
                <div className="sourcing-row-controls">
                  <div className="select-wrap sourcing-dealer-select">
                    <select
                      className="input select"
                      value={row.seller_id}
                      aria-label={`Dealer for sourcing option ${index + 1}`}
                      aria-invalid={error ? true : undefined}
                      onChange={(event) => update(index, { seller_id: event.target.value })}
                    >
                      <option value="">Choose a dealer…</option>
                      {options.map((dealer) => (
                        <option key={dealer.seller_id} value={dealer.seller_id}>
                          {dealerLabel(dealer)}
                        </option>
                      ))}
                    </select>
                    <svg className="select-chevron" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="m6 9 6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="cost-input">
                    <span className="cost-symbol" aria-hidden="true">
                      {symbol}
                    </span>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Cost"
                      value={row.buy_price}
                      aria-label={`Cost from sourcing option ${index + 1}`}
                      aria-invalid={error ? true : undefined}
                      onChange={(event) => update(index, { buy_price: event.target.value })}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    iconLeft="trash"
                    className="btn-danger-text"
                    aria-label={`Remove sourcing option ${index + 1}`}
                    onClick={() => remove(index)}
                  />
                </div>

                <div className="sourcing-row-note">
                  {error ? (
                    <span className="field-error">{error}</span>
                  ) : isCheapest ? (
                    <span className="sourcing-best">
                      <Icon name="check" size={13} />
                      Cheapest — used by default when an order comes in
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="sourcing-actions">
        <Button
          variant="secondary"
          size="sm"
          iconLeft="plus"
          onClick={add}
          disabled={dealers.length > 0 && rows.length >= dealers.length}
        >
          Add a dealer
        </Button>

        {dealers.length === 0 && (
          <span className="field-hint">Add dealers under Dealers first, then link them here.</span>
        )}

        {cheapest !== undefined && (
          <span className="field-hint">Best cost {formatCurrency(cheapest)}</span>
        )}
      </div>
    </div>
  );
}
