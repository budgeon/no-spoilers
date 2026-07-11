import { useState, useMemo } from "react";
import { G } from "../constants/tokens.js";
import { useWatchlistToggle } from "../hooks/useWatchlistToggle.js";
import Center from "../components/Center.jsx";
import PosterCard from "../components/PosterCard.jsx";

const SORT_OPTS = [{k:"watched",l:"Recent"},{k:"az",l:"A–Z"},{k:"rating",l:"Rating"},{k:"added",l:"Added"}];

export default function MoviesTab({watched, watchlist, setWatchlist, ratings, onSelect}) {
  const [tab, setTab] = useState("watched");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("watched");
  const toggleWL = useWatchlistToggle(watchlist, setWatchlist);

  const applySearch = (items, q) => { if (!q.trim()) return items; const lq = q.toLowerCase(); return items.filter(x => (x.name || x.title || "").toLowerCase().includes(lq)); };
  const applySort = (items, s) => { const r = [...items]; if (s === "az") r.sort((a,b) => (a.name||a.title||"").localeCompare(b.name||b.title||"")); else if (s === "rating") { const score = x => ratings[`${x.type||x.media_type}_${x.id}`] || (x.vote_average ? x.vote_average/2 : 0); r.sort((a,b) => score(b)-score(a)); } else if (s === "watched") r.sort((a,b) => (b.watchedAt||0)-(a.watchedAt||0)); else if (s === "added") r.sort((a,b) => (b.addedAt||0)-(a.addedAt||0)); return r; };

  const watchedMovies = useMemo(
    () => Object.entries(watched).filter(([k]) => !k.startsWith("ep_") && watched[k]?.type === "movie").map(([,v]) => v),
    [watched]
  );
  const wlMovies = useMemo(() => Object.values(watchlist).filter(x => x.type === "movie"), [watchlist]);

  const activeSort = sort === "watched" && tab === "watchlist" ? "added" : sort;
  const visWatched   = useMemo(() => applySort(applySearch(watchedMovies, query), activeSort), [watchedMovies, query, activeSort, ratings]);
  const visWatchlist = useMemo(() => applySort(applySearch(wlMovies,      query), activeSort), [wlMovies,      query, activeSort, ratings]);

  const display = tab === "watched" ? visWatched : visWatchlist.map(x => ({...x, ...x.item, id: x.id}));
  const counts = {watched: visWatched.length, watchlist: visWatchlist.length};

  return (
    <div>
      <div style={{position:"relative", marginBottom:12}}>
        <span style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:G.muted, pointerEvents:"none"}}>🔍</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search movies…"
          style={{width:"100%", background:G.surface, border:`1px solid ${G.border}`, borderRadius:10, padding:"9px 12px 9px 34px", fontSize:13, color:G.text, boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:2}}>
        {SORT_OPTS.map(o => <button key={o.k} onClick={() => setSort(o.k)} className={`season-chip${sort === o.k ? " active" : ""}`}>{o.l}</button>)}
      </div>
      <div className="sub-tabs">
        {[["watched","Watched"], ["watchlist","Watchlist"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`sub-tab${tab === id ? " active" : ""}`}>{label} ({counts[id]})</button>
        ))}
      </div>
      {display.length === 0
        ? <Center py={64}><div style={{textAlign:"center", color:G.dim, fontSize:13}}>{query ? `No movies match "${query}".` : tab === "watched" ? "No movies logged yet." : "No movies in your watchlist."}</div></Center>
        : <div className="poster-grid">
            {display.map(item => {
              const mi = {...item, media_type: "movie"};
              return <PosterCard key={item.id} item={mi} onClick={() => onSelect(mi)} epProgress={null} watched={!!watched[`movie_${item.id}`]} inWL={!!watchlist[`movie_${item.id}`]} onWL={() => toggleWL(mi)}/>;
            })}
          </div>
      }
    </div>
  );
}
