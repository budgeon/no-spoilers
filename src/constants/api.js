const DEV_KEY = import.meta.env.VITE_TMDB_API_KEY || "";
const IS_DEV = import.meta.env.DEV;
export const JEREMY_USER_ID = import.meta.env.VITE_JEREMY_USER_ID || "";
export const TMDB_IMG = "https://image.tmdb.org/t/p";

export const tmdb = async (path, params = {}, signal) => {
  let url;
  if (IS_DEV && DEV_KEY) {
    url = new URL(`https://api.themoviedb.org/3${path}`);
    url.searchParams.set("api_key", DEV_KEY);
  } else {
    url = new URL("/api/tmdb", window.location.origin);
    url.searchParams.set("path", path);
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url, signal ? { signal } : undefined);
  if (!r.ok) throw new Error(r.status);
  return r.json();
};

export const hasKey = () => IS_DEV ? !!DEV_KEY : true;
