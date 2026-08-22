import { formatCurrency } from '../../../lib/format';
import type { NamedValue } from '../../../lib/metrics';

export interface BarListProps {
  items: NamedValue[];
  emptyMessage: string;
  /** Format values as currency rather than plain counts. */
  currency?: boolean;
}

/**
 * Horizontal ranked bars.
 *
 * Plain elements rather than SVG: the labels need to wrap and truncate like text, which is
 * awkward inside an SVG and free here.
 */
export function BarList({ items, emptyMessage, currency = true }: BarListProps) {
  if (items.length === 0) {
    return (
      <div className="chart-empty" style={{ height: 160 }}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const max = Math.max(...items.map((item) => item.value));

  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li key={item.label} className="bar-row">
          <div className="bar-head">
            <span className="bar-label" title={item.label}>
              {item.label}
            </span>
            <span className="bar-value">
              {currency ? formatCurrency(item.value) : item.value.toLocaleString()}
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
