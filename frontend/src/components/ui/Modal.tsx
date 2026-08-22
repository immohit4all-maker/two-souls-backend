import { useId } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialog } from '../../lib/useDialog';
import { cx } from '../../lib/format';
import { Icon } from './Icon';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  footer?: ReactNode;
  children: ReactNode;
  /** When provided the body and footer are wrapped in a form, so the footer submit works. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  onSubmit,
}: ModalProps) {
  const containerRef = useDialog(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

  if (!open) return null;

  const body = (
    <>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </>
  );

  return createPortal(
    <div
      className="dialog-overlay"
      // mousedown rather than click: a drag that starts inside the panel and releases on the
      // backdrop should not count as a dismissal.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        className={cx('dialog-panel', `dialog-${size}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className="dialog-header">
          <div>
            <h2 className="dialog-title" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="dialog-description" id={descriptionId}>
                {description}
              </p>
            )}
          </div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={18} />
          </button>
        </header>

        {onSubmit ? (
          <form className="dialog-form" onSubmit={onSubmit} noValidate>
            {body}
          </form>
        ) : (
          <div className="dialog-form">{body}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
