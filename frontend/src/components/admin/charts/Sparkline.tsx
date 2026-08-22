import { useId } from 'react';
import { formatCurrency } from '../../../lib/format';
import type { DayPoint } from '../../../lib/metrics';

export interface SparklineProps {
  points: DayPoint[];
  height?: number;
  label: string;
}

/**
 * Hand-rolled trend line — no charting dependency.
 *
 * The viewBox is a fixed 100×30 grid stretched to the container with
 * `preserveAspectRatio="none"`; `vector-effect="non-scaling-stroke"` keeps the line an even
 * weight despite the non-uniform scale.
 */
export function Sparkline({ points, height = 132, label }: SparklineProps) {
  const gradientId = useId();

  const values = points.map((point) => point.value);
  const max = Math.max(...values, 0);
  const hasData = points.length > 1 && max > 0;

  if (!hasData) {
    return (
      <div className="chart-empty" style={{ height }}>
        <p>No revenue recorded in this period yet.</p>
      </div>
    );
  }

  const width = 100;
  const top = 2;
  const usable = 30 - top;

  const coordinates = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = top + usable - (point.value / max) * usable;
    return { x, y, point };
  });

  const line = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const area = `${line} L${width},30 L0,30 Z`;
  const peak = coordinates.reduce((best, current) => (current.y < best.y ? current : best));

  return (
    <figure className="chart">
      <svg
        className="sparkline"
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        style={{ height }}
        role="img"
        aria-label={`${label}. Peak of ${formatCurrency(peak.point.value)} on ${peak.point.label}.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <figcaption className="chart-axis">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </figcaption>
    </figure>
  );
}
