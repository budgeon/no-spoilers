import { useState } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import Center from "../components/Center.jsx";
import PosterCard from "../components/PosterCard.jsx";

export default function MoviesTab({watched, watchlist, setWatchlist, onSelect}) {
  const [tab, setTab] = useState("watched");
  const watchedMovies = Object.entries(watched).filter(([k]) => !k.startsWith("ep_") && watched[k]?.type === "movie").map(([,v]) => v);
  const wlMovies = Object.values(watchlist).filter(x => x.type === "movie");
  const display = tab === "watched" ? watchedMovies : wlMovies.map(x => ({...x, ...x.item, id: x.id}));
  const toggleWL = item => { const k = `movie_${item.id}`; const w = {...watchlist}; if (w[k]) delete w[k]; else w[k] = {id: item.id, type: "movie", name: item.title || item.name, poster_path: item.poster_path, addedAt: Date.now(), item: {...item, media_type: "movie"}}; setWatchlist(w); LS.set(SK.WL, w); };

  return (
    <div>
      <div className="sub-tabs">
        {[["watched","Watched"], ["watchlist","Watchlist"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`sub-tab${tab === id ? " active" : ""}`}>{label}</button>
        ))}
      </div>
      {display.length === 0
        ? <Center py={64}><div style={{textAlign:"center", color:G.dim, fontSize:13}}>{tab === "watched" ? "No movies logged yet." : "No movies in your watchlist."}</div></Center>
        : <div className="poster-grid">
            {display.map(item => {
              const mi = {...item, media_type: "movie"};
              return <PosterCard key={item.id} item={mi} onClick={() => onSelect(mi)} epProgress={null} watched={!!watched[`movie_${item.id}`]} inWL={!!watchlist[`movie_${item.id}`]} onWL={() => toggleWL(item)}/>;
            })}
          </div>
      }
    </div>
  );
}
