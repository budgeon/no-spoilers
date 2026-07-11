import { G } from "../constants/tokens.js";

export default function Pill({label,color=G.accent,bg=G.accentDim}) {
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:600,color,background:bg,letterSpacing:"0.04em"}}>{label}</span>;
}
