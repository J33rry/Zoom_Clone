import { type DependencyList, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
}

/**
 * Run an async loader on mount / when deps change; ignores results from stale runs.
 * `deps` must be JSON-serialisable (ids, strings, timestamps).
 */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [version, setVersion] = useState(0);
  const depsKey = JSON.stringify(deps);
  // A fresh object identifies each request; the result records which request it answers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const request = useMemo(() => ({}), [depsKey, version]);
  const [result, setResult] = useState<{ request: object | null; data?: T; error?: Error }>({ request: null });
  const latest = useRef(request);

  useEffect(() => {
    latest.current = request;
    loader().then(
      (data) => latest.current === request && setResult({ request, data }),
      (error: Error) => latest.current === request && setResult((prev) => ({ request, data: prev.data, error })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data: result.data, error: result.error, loading: result.request !== request, reload };
}
