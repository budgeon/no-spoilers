import { G } from "../constants/tokens.js";

export default function ProgressBar({value,max,color=G.accent,h=3}) {
  const pct = max>0 ? Math.min(100,(value/max)*100) : 0;
  return <div style={{background:"rgba(255,255,255,0.1)",borderRadius:99,overflow:"hidden",height:h}}>
    <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.4s"}} />
  </div>;
}
