import { useState, useEffect } from "react";
import { hasKey } from "../constants/api.js";

const cache = new Map();
const TTL = 5 * 60 * 1000;

export function useTMDB(fetchFn, fallback, deps, cacheKey = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fetchFn) { setLoading(false); return; }

    if (cacheKey) {
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.ts < TTL) {
        setData(hit.data);
        setLoading(false);
        return;
      }
    }

    if (!hasKey()) {
      setData(typeof fallback === "function" ? fallback() : fallback);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const ac = new AbortController();
    setLoading(true);

    fetchFn(ac.signal)
      .then(result => {
        if (!cancelled) {
          if (cacheKey) cache.set(cacheKey, { data: result, ts: Date.now() });
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(typeof fallback === "function" ? fallback() : fallback);
          setLoading(false);
        }
      });

    return () => { cancelled = true; ac.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}
