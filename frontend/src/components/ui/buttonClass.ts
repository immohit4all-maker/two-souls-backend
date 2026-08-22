import { cx } from '../../lib/format';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
}

/**
 * Lives apart from `Button` so router `Link`s and anchors can wear the same styling without
 * `react-refresh/only-export-components` complaining about a non-component export.
 */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  className,
}: ButtonClassOptions = {}): string {
  return cx(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-block',
    iconOnly && 'btn-icon',
    className,
  );
}
