export const LS = {
  get: (k, fb={}) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
};

export const SK = { W:"tt_watched", WL:"tt_watchlist", R:"tt_ratings", U:"tt_user", DB:"tt_users_db", C:"tt_comments", EP:"tt_ep_totals", REC:"tt_recent", EC:"tt_enrich_cache" };
