import { G } from "../constants/tokens.js";
import { TMDB_IMG } from "../constants/api.js";
import ProgressBar from "./ProgressBar.jsx";

export default function PosterCard({item,onClick,epProgress,watched,inWL,onWL}) {
  const name = item.name||item.title;
  const type = item.media_type;
  const hasProgress = epProgress&&epProgress.total>0;
  const pct = hasProgress ? Math.round((epProgress.watched/epProgress.total)*100) : 0;
  return (
    <div className="card-hover" onClick={onClick} style={{position:"relative"}}>
      <div style={{borderRadius:8,overflow:"hidden",background:"#DDD7CC",aspectRatio:"2/3",position:"relative",marginBottom:6}}>
        {item.poster_path
          ? <img src={`${TMDB_IMG}/w300${item.poster_path}`} alt={name} loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(107,140,174,0.3)",fontSize:28}}>{type==="tv"?"📺":"🎬"}</div>
        }
        {watched&&!hasProgress&&<div style={{position:"absolute",top:6,right:6,background:G.green,borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>✓</div>}
        <button onClick={e=>{e.stopPropagation();onWL(item);}} style={{position:"absolute",top:6,left:6,width:26,height:26,borderRadius:"50%",background:inWL?"rgba(107,140,174,0.9)":"rgba(245,240,232,0.85)",border:"none",color:inWL?"#fff":"rgba(30,37,53,0.5)",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",transition:"all 0.15s"}}>
          {inWL?"★":"☆"}
        </button>
      </div>
      {hasProgress&&<div style={{marginBottom:4}}><ProgressBar value={epProgress.watched} max={epProgress.total} color={G.accent} h={3}/></div>}
      <div style={{fontSize:12,fontWeight:500,color:G.text,lineHeight:1.3,marginBottom:2}}>{name}</div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {hasProgress&&<span style={{fontSize:10,color:G.accent,fontWeight:600}}>{pct}%</span>}
        {item.vote_average>0&&<span style={{fontSize:10,color:G.dim}}>★ {item.vote_average.toFixed(1)}</span>}
      </div>
    </div>
  );
}
