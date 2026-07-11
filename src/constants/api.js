const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";
export const TMDB_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMG = "https://image.tmdb.org/t/p";

export const tmdb = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
};

export const hasKey = () => TMDB_API_KEY && TMDB_API_KEY !== "YOUR_TMDB_API_KEY_HERE";
