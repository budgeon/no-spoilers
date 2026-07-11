import { useState, useMemo } from "react";
import { G } from "../constants/tokens.js";
import { useWatchlistToggle } from "../hooks/useWatchlistToggle.js";
import Center from "../components/Center.jsx";
import PosterCard from "../components/PosterCard.jsx";

const SORT_OPTS = [{k:"watched",l:"Recent"},{k:"az",l:"A–Z"},{k:"rating",l:"Rating"},{k:"added",l:"Added"}];

export default function ShowsTab({watched, setWatched, watchlist, setWatchlist, ratings, setRatings, epTotals, setEpTotals, onSelect, onFinish, user}) {
  const [tab, setTab] = useState("watching");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("watched");
  const toggleWL = useWatchlistToggle(watchlist, setWatchlist, user.id);

  const applySearch = (items, q) => { if (!q.trim()) return items; const lq = q.toLowerCase(); return items.filter(x => (x.name || x.title || "").toLowerCase().includes(lq)); };
  const applySort = (items, s) => { const r = [...items]; if (s === "az") r.sort((a,b) => (a.name||a.title||"").localeCompare(b.name||b.title||"")); else if (s === "rating") { const score = x => ratings[`${x.type||x.media_type}_${x.id}`] || (x.vote_average ? x.vote_average/2 : 0); r.sort((a,b) => score(b)-score(a)); } else if (s === "watched") r.sort((a,b) => (b.watchedAt||0)-(a.watchedAt||0)); else if (s === "added") r.sort((a,b) => (b.addedAt||0)-(a.addedAt||0)); return r; };

  const watchedTitles = useMemo(
    () => Object.entries(watched).filter(([k]) => !k.startsWith("ep_") && watched[k]?.type === "tv").map(([,v]) => v),
    [watched]
  );
  const completedItems = useMemo(
    () => watchedTitles.filter(t => { const tot = epTotals[t.id] || 0; const wc = Object.keys(watched).filter(k => k.startsWith(`ep_show${t.id}_`)).length; return tot > 0 && wc >= tot; }),
    [watchedTitles, epTotals, watched]
  );
  const watchingItems = useMemo(
    () => watchedTitles.filter(t => { const tot = epTotals[t.id] || 0; const wc = Object.keys(watched).filter(k => k.startsWith(`ep_show${t.id}_`)).length; return !(tot > 0 && wc >= tot); }),
    [watchedTitles, epTotals, watched]
  );
  const watchlistItems = useMemo(() => Object.values(watchlist).filter(x => x.type === "tv"), [watchlist]);

  const activeSort = sort === "watched" && tab === "watchlist" ? "added" : sort;
  const visWatching  = useMemo(() => applySort(applySearch(watchingItems,  query), activeSort), [watchingItems,  query, activeSort, ratings]);
  const visCompleted = useMemo(() => applySort(applySearch(completedItems, query), activeSort), [completedItems, query, activeSort, ratings]);
  const visWatchlist = useMemo(() => applySort(applySearch(watchlistItems, query), activeSort), [watchlistItems, query, activeSort, ratings]);

  const visList = tab === "watching" ? visWatching : tab === "completed" ? visCompleted : visWatchlist;
  const display = tab === "watchlist" ? visList.map(x => ({...x, ...x.item, id: x.id})) : visList;
  const empty = tab === "watching" ? "Start tracking shows to see them here." : tab === "completed" ? "No completed shows yet." : "Star a show to add it to your watchlist.";
  const counts = {watching: visWatching.length, watchlist: visWatchlist.length, completed: visCompleted.length};

  const getEpProg = item => { const t = epTotals[item.id] || 0; const w = Object.keys(watched).filter(k => k.startsWith(`ep_show${item.id}_`)).length; return t > 0 ? {watched: Math.min(w, t), total: t} : null; };

  return (
    <div>
      <div style={{position:"relative", marginBottom:12}}>
        <span style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:G.muted, pointerEvents:"none"}}>🔍</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search shows…"
          style={{width:"100%", background:G.surface, border:`1px solid ${G.border}`, borderRadius:10, padding:"9px 12px 9px 34px", fontSize:13, color:G.text, boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:2}}>
        {SORT_OPTS.map(o => <button key={o.k} onClick={() => setSort(o.k)} className={`season-chip${sort === o.k ? " active" : ""}`}>{o.l}</button>)}
      </div>
      <div className="sub-tabs">
        {[["watching","Watching"], ["watchlist","Watchlist"], ["completed","Completed"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`sub-tab${tab === id ? " active" : ""}`}>{label} ({counts[id]})</button>
        ))}
      </div>
      {display.length === 0
        ? <Center py={64}><div style={{textAlign:"center", color:G.dim, fontSize:13}}>{query ? `No shows match "${query}".` : empty}</div></Center>
        : <div className="poster-grid">
            {display.map(item => {
              const mediaItem = {...item, media_type: "tv"};
              return <PosterCard key={item.id} item={mediaItem} onClick={() => onSelect(mediaItem)} epProgress={getEpProg(item)} watched={!!watched[`tv_${item.id}`]} inWL={!!watchlist[`tv_${item.id}`]} onWL={() => toggleWL(mediaItem)}/>;
            })}
          </div>
      }
    </div>
  );
}
