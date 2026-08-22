import { useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cloneElement } from 'react';
import { cx } from '../../lib/format';

export interface FieldProps {
  label: string;
  /** Guidance shown under the control when there is no error. */
  hint?: string;
  error?: string;
  required?: boolean;
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean;
  className?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;
}

/**
 * Wraps a single control with its label, hint and error, wiring up `id`, `aria-describedby`
 * and `aria-invalid` so the association is correct without every caller remembering to do it.
 */
export function Field({
  label,
  hint,
  error,
  required,
  hideLabel,
  className,
  children,
}: FieldProps) {
  const reactId = useId();
  const controlId = children.props.id ?? `field-${reactId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('field', error && 'field-invalid', className)}>
      <label htmlFor={controlId} className={cx('field-label', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="field-required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {cloneElement(children, {
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}

      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="field-hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('input', className)} {...rest} />;
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function SelectInput({ className, children, ...rest }: SelectInputProps) {
  return (
    <div className="select-wrap">
      <select className={cx('input', 'select', className)} {...rest}>
        {children}
      </select>
      <svg className="select-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
  );
}

export function TextArea({ className, rows = 3, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('input', 'textarea', className)} rows={rows} {...rest} />;
}
