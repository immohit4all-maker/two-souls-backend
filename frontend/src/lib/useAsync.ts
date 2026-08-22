import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './apiClient';

export interface AsyncResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Run an async function on mount and expose {data, loading, error, reload}.
 *
 * `loading` is cleared in a `finally`, so a rejected request can never leave the UI spinning —
 * which is exactly the failure the hand-rolled fetches in the old AdminPortal had. Responses
 * from a superseded run are discarded via the run counter.
 *
 * `fn` is held in a ref (synced in an effect, never written during render) so callers can pass
 * an inline arrow without memoising it and without retriggering the fetch every render.
 */
export function useAsync<T>(fn: () => Promise<T>, initial: T): AsyncResult<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fnRef = useRef(fn);
  const runId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Deliberately contains no synchronous state update: every setState here happens after an
   * await. That keeps the mount effect below from triggering a cascading render, which is what
   * `react-hooks/set-state-in-effect` guards against. `loading` already starts true, so the
   * first run needs no spinner toggle.
   */
  const run = useCallback(async () => {
    const id = ++runId.current;
    const isCurrent = () => mounted.current && id === runId.current;

    try {
      const result = await fnRef.current();
      if (isCurrent()) {
        setData(result);
        setError(null);
      }
    } catch (caught) {
      if (isCurrent()) setError(errorMessage(caught));
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, []);

  /** User-triggered refetch: show the spinner again, then run. */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    await run();
  }, [run]);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, loading, error, reload };
}
