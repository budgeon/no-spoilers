import { useCallback } from "react";
import { upsertWatchlistItem, deleteWatchlistItem } from "../lib/db.js";

export function useWatchlistToggle(watchlist, setWatchlist, userId) {
  return useCallback((item) => {
    const type = item.media_type || item.type;
    const k = `${type}_${item.id}`;
    const w = { ...watchlist };
    if (w[k]) { delete w[k]; setWatchlist(w); deleteWatchlistItem(userId, k); }
    else {
      const entry = { id: item.id, type, name: item.name || item.title, poster_path: item.poster_path, addedAt: Date.now(), item: item.media_type ? item : { ...item, media_type: type } };
      w[k] = entry; setWatchlist(w); upsertWatchlistItem(userId, k, entry);
    }
  }, [watchlist, setWatchlist, userId]);
}
