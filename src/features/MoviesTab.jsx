import { useState, useMemo } from "react";
import { G } from "../constants/tokens.js";
import { useWatchlistToggle } from "../hooks/useWatchlistToggle.js";
import Center from "../components/Center.jsx";
import PosterCard from "../components/PosterCard.jsx";

export default function MoviesTab({watched, watchlist, setWatchlist, onSelect}) {
  const [tab, setTab] = useState("watched");
  const toggleWL = useWatchlistToggle(watchlist, setWatchlist);

  const watchedMovies = useMemo(
    () => Object.entries(watched).filter(([k]) => !k.startsWith("ep_") && watched[k]?.type === "movie").map(([,v]) => v),
    [watched]
  );
  const wlMovies = useMemo(
    () => Object.values(watchlist).filter(x => x.type === "movie"),
    [watchlist]
  );

  const display = tab === "watched" ? watchedMovies : wlMovies.map(x => ({...x, ...x.item, id: x.id}));

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
              return <PosterCard key={item.id} item={mi} onClick={() => onSelect(mi)} epProgress={null} watched={!!watched[`movie_${item.id}`]} inWL={!!watchlist[`movie_${item.id}`]} onWL={() => toggleWL(mi)}/>;
            })}
          </div>
      }
    </div>
  );
}
