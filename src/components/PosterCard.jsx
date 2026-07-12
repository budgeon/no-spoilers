import { memo } from "react";
import { TMDB_IMG } from "../constants/api.js";
import ProgressBar from "./ProgressBar.jsx";

export default memo(function PosterCard({item, onClick, epProgress, watched, inWL, onWL}) {
  const name = item.name || item.title;
  const type = item.media_type;
  const hasProgress = epProgress && epProgress.total > 0;
  const pct = hasProgress ? Math.round((epProgress.watched / epProgress.total) * 100) : 0;
  return (
    <div className="card-hover" onClick={onClick} style={{position:"relative"}}>
      <div className="poster-img-wrap">
        {item.poster_path
          ? <img src={`${TMDB_IMG}/w300${item.poster_path}`} alt={name} loading="lazy" style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}} />
          : <div className="poster-placeholder">{type === "tv" ? "📺" : "🎬"}</div>
        }
        {watched && !hasProgress && <div className="poster-watched-badge">✓</div>}
        <button onClick={e => { e.stopPropagation(); onWL(item); }} className={`poster-wl-btn${inWL ? " in-wl" : ""}`}>
          {inWL
            ? <svg width="12" height="15" viewBox="0 0 12 15" fill="currentColor"><path d="M0 0h12v15l-6-3.5L0 15z"/></svg>
            : <svg width="12" height="15" viewBox="0 0 12 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M1 1h10v13l-5-3-5 3z"/></svg>
          }
        </button>
      </div>
      {hasProgress && <div style={{marginBottom:4}}><ProgressBar value={epProgress.watched} max={epProgress.total} h={3}/></div>}
      <div className="poster-title">{name}</div>
      <div className="poster-meta">
        {hasProgress && <span className="poster-pct">{pct}%</span>}
        {item.vote_average > 0 && <span className="poster-rating">★ {item.vote_average.toFixed(1)}</span>}
      </div>
    </div>
  );
});
