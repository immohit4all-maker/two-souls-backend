import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './toast-context';
import type { Toast, ToastContextValue, ToastTone } from './toast-context';
import { Icon } from './Icon';
import type { IconName } from './Icon';

/** Errors linger — the reader may need to act on them; confirmations can go quietly. */
const DURATIONS: Record<ToastTone, number> = {
  success: 4000,
  info: 5000,
  error: 9000,
};

const TONE_ICONS: Record<ToastTone, IconName> = {
  success: 'check-circle',
  info: 'info',
  error: 'alert',
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ tone, title, description }: Omit<Toast, 'id'>) => {
      const id = `toast-${(nextId += 1)}`;
      setToasts((current) => [...current, { id, tone, title, description }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATIONS[tone]),
      );
    },
    [dismiss],
  );

  // Clear any pending timers if the provider itself goes away.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      dismiss,
      success: (title, description) => notify({ tone: 'success', title, description }),
      error: (title, description) => notify({ tone: 'error', title, description }),
      info: (title, description) => notify({ tone: 'info', title, description }),
    }),
    [notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-viewport" role="region" aria-label="Notifications">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast-${toast.tone}`}
              // Errors interrupt; the rest wait for a pause in screen-reader output.
              role={toast.tone === 'error' ? 'alert' : 'status'}
              aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
            >
              <span className="toast-icon">
                <Icon name={TONE_ICONS[toast.tone]} size={18} />
              </span>
              <div className="toast-content">
                <p className="toast-title">{toast.title}</p>
                {toast.description && <p className="toast-description">{toast.description}</p>}
              </div>
              <button
                type="button"
                className="toast-close"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
