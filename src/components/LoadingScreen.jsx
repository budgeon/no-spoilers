import { G } from "../constants/tokens.js";
import Spinner from "./Spinner.jsx";

export default function LoadingScreen() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"120px 0"}}>
      <div style={{fontSize:28,fontWeight:800,fontFamily:"'Outfit', sans-serif",color:G.text,letterSpacing:"-0.02em",marginBottom:24}}>
        No<span style={{color:G.accent}}>Spoilers</span>
      </div>
      <Spinner/>
    </div>
  );
}
