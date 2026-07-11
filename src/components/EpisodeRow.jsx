import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";

export default function EpisodeRow({ep,showId,watched,onToggle,onOpenComments}) {
  const key = `ep_show${showId}_ep${ep.id}`;
  const ew = !!watched[key];
  const commentCount = LS.get(SK.C,{})[`show${showId}_ep${ep.id}`]?.length||0;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${G.border}`}}>
      <button onClick={()=>onToggle(ep)} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${ew?G.accent:G.border2}`,background:ew?G.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:ew?"#000":"transparent",fontWeight:700,flexShrink:0,transition:"all 0.15s"}}>✓</button>
      <div style={{flex:1,cursor:"pointer"}} onClick={()=>onOpenComments(ep)}>
        <div style={{fontSize:13,fontWeight:ew?400:500,color:ew?G.muted:G.text}}><span style={{color:G.dim,marginRight:6}}>E{ep.episode_number}</span>{ep.name}</div>
        <div style={{display:"flex",gap:8,marginTop:3}}>
          {ep.air_date&&<span style={{fontSize:11,color:G.dim}}>{ep.air_date}</span>}
          {commentCount>0&&<span style={{fontSize:11,color:G.blue}}>💬 {commentCount}</span>}
        </div>
      </div>
      <button onClick={()=>onOpenComments(ep)} style={{fontSize:11,color:G.dim,padding:"4px 8px",borderRadius:6,border:`1px solid ${G.border}`,background:"transparent",flexShrink:0}}>Discuss</button>
    </div>
  );
}
