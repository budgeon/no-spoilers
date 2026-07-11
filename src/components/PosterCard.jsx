import { TMDB_IMG } from "../constants/api.js";
import ProgressBar from "./ProgressBar.jsx";

export default function PosterCard({item, onClick, epProgress, watched, inWL, onWL}) {
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
          {inWL ? "★" : "☆"}
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
}
