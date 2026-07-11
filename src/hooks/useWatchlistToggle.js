import { useCallback } from "react";
import { LS, SK } from "../constants/storage.js";

export function useWatchlistToggle(watchlist, setWatchlist) {
  return useCallback((item) => {
    const type = item.media_type || item.type;
    const k = `${type}_${item.id}`;
    const w = { ...watchlist };
    if (w[k]) delete w[k];
    else w[k] = {
      id: item.id,
      type,
      name: item.name || item.title,
      poster_path: item.poster_path,
      addedAt: Date.now(),
      item: item.media_type ? item : { ...item, media_type: type },
    };
    setWatchlist(w);
    LS.set(SK.WL, w);
  }, [watchlist, setWatchlist]);
}
