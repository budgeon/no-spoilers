import { memo } from "react";
import { LS, SK } from "../constants/storage.js";

export default memo(function EpisodeRow({ep, showId, watched, onToggle, onOpenComments}) {
  const key = `ep_show${showId}_ep${ep.id}`;
  const ew = !!watched[key];
  const commentCount = LS.get(SK.C, {})[`show${showId}_ep${ep.id}`]?.length || 0;
  return (
    <div className="episode-row">
      <button onClick={() => onToggle(ep)} className={`episode-check${ew ? " watched" : ""}`}>✓</button>
      <div style={{flex:1, cursor:"pointer"}} onClick={() => onOpenComments(ep)}>
        <div className={`episode-title${ew ? " watched" : ""}`}>
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
