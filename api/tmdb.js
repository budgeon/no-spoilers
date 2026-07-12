export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path || !path.startsWith("/")) {
    return new Response("Bad request", { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return new Response("Not configured", { status: 503 });

  const upstream = new URL(`https://api.themoviedb.org/3${path}`);
  upstream.searchParams.set("api_key", apiKey);
  searchParams.forEach((v, k) => { if (k !== "path") upstream.searchParams.set(k, v); });

  const r = await fetch(upstream, { signal: req.signal });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=300" },
  });
}
