import { useState, useEffect, useCallback } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import { tmdb, hasKey } from "../constants/api.js";
import { MOCK_TV, MOCK_MOVIES, TV_GENRES, MOVIE_GENRES } from "../constants/mockData.js";
import Center from "../components/Center.jsx";
import Spinner from "../components/Spinner.jsx";
import PosterCard from "../components/PosterCard.jsx";

export default function DiscoverTab({watched, watchlist, setWatchlist, onSelect}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mediaType, setMediaType] = useState("tv");
  const [genre, setGenre] = useState(null);
  const [browse, setBrowse] = useState([]);
  const [bLoading, setBLoading] = useState(true);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        if (hasKey()) {
          const [tv, mv] = await Promise.all([tmdb("/trending/tv/week"), tmdb("/trending/movie/week")]);
          setTrending([...tv.results.slice(0,4).map(x => ({...x, media_type:"tv"})), ...mv.results.slice(0,4).map(x => ({...x, media_type:"movie"}))]);
        } else throw new Error();
      } catch { setTrending([...MOCK_TV.slice(0,4), ...MOCK_MOVIES.slice(0,4)]); }
    })();
  }, []);

  useEffect(() => {
    if (query) return;
    setBLoading(true);
    (async () => {
      try {
        if (hasKey()) { const p = genre ? {with_genres: genre, sort_by:"popularity.desc"} : {sort_by:"popularity.desc"}; const d = await tmdb(`/discover/${mediaType}`, p); setBrowse(d.results.slice(0,12).map(x => ({...x, media_type: mediaType}))); }
        else throw new Error();
      } catch { setBrowse(mediaType === "tv" ? MOCK_TV : MOCK_MOVIES); }
      setBLoading(false);
    })();
  }, [mediaType, genre, query]);

  const search = useCallback(async q => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try { if (hasKey()) { const d = await tmdb("/search/multi", {query: q}); setResults(d.results.filter(x => x.media_type === "tv" || x.media_type === "movie")); } else throw new Error(); }
    catch { setResults([...MOCK_TV, ...MOCK_MOVIES].filter(x => (x.name || x.title).toLowerCase().includes(q.toLowerCase()))); }
    setSearching(false);
  }, []);

  useEffect(() => { const t = setTimeout(() => search(query), 350); return () => clearTimeout(t); }, [query, search]);

  const toggleWL = item => { const k = `${item.media_type}_${item.id}`; const w = {...watchlist}; if (w[k]) delete w[k]; else w[k] = {id: item.id, type: item.media_type, name: item.name || item.title, poster_path: item.poster_path, addedAt: Date.now(), item}; setWatchlist(w); LS.set(SK.WL, w); };
  const genres = mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
  const display = query ? results : [...browse];

  return (
    <div>
      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search shows, movies…"
          className="search-input"
        />
      </div>

      {!query && (
        <>
          <div className="type-toggle">
            {[["tv","TV Shows"], ["movie","Movies"]].map(([t, l]) => (
              <button key={t} onClick={() => { setMediaType(t); setGenre(null); }} className={`type-btn${mediaType === t ? " active" : ""}`}>{l}</button>
            ))}
          </div>

          <div style={{display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:4}}>
            {genres.map(g => (
              <button key={g.id} onClick={() => setGenre(g.id)} className={`chip${genre === g.id ? " active" : ""}`}>{g.name}</button>
            ))}
          </div>

          {trending.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13, fontWeight:600, color:G.text, marginBottom:12}}>🔥 Trending</div>
              <div className="trending-grid">
                {trending.slice(0,4).map(item => <PosterCard key={`t_${item.media_type}_${item.id}`} item={item} onClick={() => onSelect(item)} epProgress={null} watched={!!watched[`${item.media_type}_${item.id}`]} inWL={!!watchlist[`${item.media_type}_${item.id}`]} onWL={() => toggleWL(item)}/>)}
              </div>
            </div>
          )}
          <div style={{fontSize:13, fontWeight:600, color:G.text, marginBottom:12}}>Browse {mediaType === "tv" ? "TV Shows" : "Movies"}</div>
        </>
      )}

      {(searching || bLoading) && !query.trim()
        ? null
        : <div className="poster-grid">
            {display.map(item => <PosterCard key={`${item.media_type}_${item.id}`} item={item} onClick={() => onSelect(item)} epProgress={null} watched={!!watched[`${item.media_type}_${item.id}`]} inWL={!!watchlist[`${item.media_type}_${item.id}`]} onWL={() => toggleWL(item)}/>)}
          </div>
      }
      {(searching || bLoading) && <Center><Spinner/></Center>}
    </div>
  );
}
