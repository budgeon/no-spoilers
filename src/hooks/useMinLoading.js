import { useState, useRef, useCallback } from "react";

export function useMinLoading(minMs = 500) {
  const [loading, setLoading] = useState(true);
  const startRef = useRef(Date.now());

  const begin = useCallback(() => {
    startRef.current = Date.now();
    setLoading(true);
  }, []);

  const finish = useCallback(() => {
    const remaining = minMs - (Date.now() - startRef.current);
    if (remaining > 0) setTimeout(() => setLoading(false), remaining);
    else setLoading(false);
  }, [minMs]);

  return { loading, begin, finish };
}
