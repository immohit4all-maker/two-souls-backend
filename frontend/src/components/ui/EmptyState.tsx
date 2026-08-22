import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from '../../lib/format';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  /** `error` swaps to a red icon treatment — used for failed loads rather than empty results. */
  tone?: 'neutral' | 'error';
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon = 'package',
  title,
  description,
  action,
  tone = 'neutral',
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx('empty-state', `empty-${tone}`, compact && 'empty-compact', className)}
      role={tone === 'error' ? 'alert' : undefined}
    >
      <span className="empty-icon">
        <Icon name={tone === 'error' ? 'alert' : icon} size={compact ? 20 : 26} />
      </span>
      <p className="empty-title">{title}</p>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
