import { G } from "../constants/tokens.js";

export default function Spinner({size=28}) {
  return <div style={{width:size,height:size,border:`2px solid rgba(107,140,174,0.15)`,borderTopColor:G.accent,borderRadius:"50%",animation:"spin 0.7s linear infinite"}} />;
}
