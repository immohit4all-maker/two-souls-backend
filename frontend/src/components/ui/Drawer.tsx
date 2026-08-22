import { useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialog } from '../../lib/useDialog';
import { cx } from '../../lib/format';
import { Icon } from './Icon';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: 'right' | 'left';
  width?: string;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Side panel sharing Modal's focus and scroll behaviour via `useDialog`. Used for the shopping
 * cart and for order detail, where a full modal would feel heavier than the task warrants.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  side = 'right',
  width = '420px',
  footer,
  children,
}: DrawerProps) {
  const containerRef = useDialog(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

  if (!open) return null;

  return createPortal(
    <div
      className="dialog-overlay drawer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={containerRef}
        className={cx('drawer-panel', `drawer-${side}`)}
        style={{ width }}
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
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Close panel">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer drawer-footer">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}
