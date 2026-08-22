import { titleCase } from '../../../lib/format';
import { toneColorVar, toneForStatus } from '../../ui/statusTone';
import type { StatusSlice } from '../../../lib/metrics';

export interface DonutChartProps {
  slices: StatusSlice[];
  label: string;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Order status split, drawn as stroked arcs on a single circle.
 *
 * Colours come from the same `toneForStatus` map the status badges use, so a "Shipped" arc and
 * a "Shipped" pill are always the same colour.
 */
export function DonutChart({ slices, label }: DonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  if (total === 0) {
    return (
      <div className="chart-empty" style={{ height: 180 }}>
        <p>No orders to break down yet.</p>
      </div>
    );
  }

  // Arc geometry is resolved up front in a plain loop rather than accumulated inside the JSX
  // map, so nothing is reassigned while rendering.
  const arcs = [];
  let consumed = 0;
  for (const slice of slices) {
    const fraction = slice.count / total;
    arcs.push({
      status: slice.status,
      dash: fraction * CIRCUMFERENCE,
      // Rotate each arc to start where the previous one ended.
      offset: -consumed * CIRCUMFERENCE,
    });
    consumed += fraction;
  }

  return (
    <div className="donut-wrap">
      <svg
        className="donut"
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${label}. ${slices
          .map((slice) => `${titleCase(slice.status)}: ${slice.count}`)
          .join('. ')}.`}
      >
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--surface-sunken)" strokeWidth="13" />

        {arcs.map((arc) => (
          <circle
            key={arc.status}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={toneColorVar(toneForStatus(arc.status))}
            strokeWidth="13"
            strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
            strokeDashoffset={arc.offset}
            // Start at 12 o'clock instead of 3 o'clock.
            transform="rotate(-90 50 50)"
          />
        ))}

        <text x="50" y="47" className="donut-total" textAnchor="middle">
          {total}
        </text>
        <text x="50" y="60" className="donut-caption" textAnchor="middle">
          orders
        </text>
      </svg>

      <ul className="donut-legend">
        {slices.map((slice) => (
          <li key={slice.status}>
            <span
              className="donut-swatch"
              style={{ background: toneColorVar(toneForStatus(slice.status)) }}
              aria-hidden="true"
            />
            <span className="donut-legend-label">{titleCase(slice.status)}</span>
            <span className="donut-legend-value">{slice.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
