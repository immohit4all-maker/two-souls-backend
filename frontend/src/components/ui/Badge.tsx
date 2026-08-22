import type { ReactNode } from 'react';
import { cx, titleCase } from '../../lib/format';
import { toneForStatus } from './statusTone';
import type { BadgeTone } from './statusTone';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Adds a small leading dot — useful in dense tables where colour alone is too subtle. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', dot = false, className, children }: BadgeProps) {
  return (
    <span className={cx('badge', `badge-${tone}`, className)}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export interface StatusBadgeProps {
  status?: string;
  fallback?: string;
  dot?: boolean;
}

export function StatusBadge({ status, fallback = 'Unknown', dot = true }: StatusBadgeProps) {
  return (
    <Badge tone={toneForStatus(status)} dot={dot}>
      {titleCase(status ?? fallback)}
    </Badge>
  );
}
