import { useState } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import Center from "../components/Center.jsx";
import PosterCard from "../components/PosterCard.jsx";

export default function ShowsTab({watched, setWatched, watchlist, setWatchlist, ratings, setRatings, epTotals, setEpTotals, onSelect, onFinish, user}) {
  const [tab, setTab] = useState("watching");
  const watchlistItems = Object.values(watchlist).filter(x => x.type === "tv");
  const watchedTitles = Object.entries(watched).filter(([k]) => !k.startsWith("ep_") && watched[k]?.type === "tv").map(([,v]) => v);
  const completedItems = watchedTitles.filter(t => { const tot = epTotals[t.id] || 0; const wc = Object.keys(watched).filter(k => k.startsWith(`ep_show${t.id}_`)).length; return tot > 0 && wc >= tot; });
  const watchingItems = watchedTitles.filter(t => { const tot = epTotals[t.id] || 0; const wc = Object.keys(watched).filter(k => k.startsWith(`ep_show${t.id}_`)).length; return !(tot > 0 && wc >= tot); });

  const getEpProg = item => { const t = epTotals[item.id] || 0; const w = Object.keys(watched).filter(k => k.startsWith(`ep_show${item.id}_`)).length; return t > 0 ? {watched: w, total: t} : null; };
  const toggleWL = item => { const k = `tv_${item.id}`; const w = {...watchlist}; if (w[k]) delete w[k]; else w[k] = {id: item.id, type: "tv", name: item.name, poster_path: item.poster_path, addedAt: Date.now(), item: {...item, media_type: "tv"}}; setWatchlist(w); LS.set(SK.WL, w); };

  const display = tab === "watching" ? watchingItems : tab === "completed" ? completedItems : watchlistItems.map(x => ({...x, ...x.item, id: x.id}));
  const empty = tab === "watching" ? "Start tracking shows to see them here." : tab === "completed" ? "No completed shows yet." : "Star a show to add it to your watchlist.";

  return (
    <div>
      <div className="sub-tabs">
        {[["watching","Watching"], ["watchlist","Watchlist"], ["completed","Completed"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`sub-tab${tab === id ? " active" : ""}`}>{label}</button>
        ))}
      </div>
      {display.length === 0
        ? <Center py={64}><div style={{textAlign:"center", color:G.dim, fontSize:13}}>{empty}</div></Center>
        : <div className="poster-grid">
            {display.map(item => {
              const mediaItem = {...item, media_type: "tv"};
              return <PosterCard key={item.id} item={mediaItem} onClick={() => onSelect(mediaItem)} epProgress={getEpProg(item)} watched={!!watched[`tv_${item.id}`]} inWL={!!watchlist[`tv_${item.id}`]} onWL={() => toggleWL(item)}/>;
            })}
          </div>
      }
    </div>
  );
}
