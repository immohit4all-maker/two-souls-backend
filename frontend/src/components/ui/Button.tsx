import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { buttonClass } from './buttonClass';
import type { ButtonSize, ButtonVariant } from './buttonClass';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button — use for anything that awaits the network. */
  loading?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  /** Square, label-less button. Pass `aria-label` when you use this. */
  iconOnly?: boolean;
  children?: ReactNode;
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 15, md: 17, lg: 19 };

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  fullWidth,
  iconOnly,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconSize = ICON_SIZE[size];

  return (
    <button
      type={type}
      className={buttonClass({ variant, size, fullWidth, iconOnly, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        iconLeft && <Icon name={iconLeft} size={iconSize} />
      )}
      {children && <span className="btn-label">{children}</span>}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}
