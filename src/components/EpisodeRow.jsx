import { memo, useTransition } from "react";
import Spinner from "./Spinner.jsx";

export default memo(function EpisodeRow({ep, isWatched, onToggle, onOpenComments, commentCount = 0}) {
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(() => onToggle(ep));
  };

  return (
    <div className="episode-row">
      <button onClick={handleToggle} disabled={pending} className={`episode-check${isWatched && !pending ? " watched" : ""}`}>
        {pending ? <Spinner size={14}/> : "✓"}
      </button>
      <div style={{flex:1, cursor:"pointer", minWidth:0}} onClick={() => onOpenComments(ep)}>
        <div className={`episode-title${isWatched ? " watched" : ""}`}>
          <span className="episode-num">E{ep.episode_number}</span>{ep.name}
        </div>
        <div style={{display:"flex", gap:8, marginTop:3}}>
          {ep.air_date && <span className="episode-date">{ep.air_date}</span>}
          {commentCount > 0 && <span className="episode-comments">💬 {commentCount}</span>}
        </div>
      </div>
      <button onClick={() => onOpenComments(ep)} className="episode-discuss">Discuss</button>
    </div>
  );
});
