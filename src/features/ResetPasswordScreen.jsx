import { useState } from "react";
import { G } from "../constants/tokens.js";
import { Auth } from "../auth/Auth.js";
import Spinner from "../components/Spinner.jsx";

export default function ResetPasswordScreen() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (pw !== confirm) { setErr("Passwords don't match."); return; }
    setLoading(true);
    const { error } = await Auth.updatePassword(pw);
    setLoading(false);
    if (error) setErr(error.message);
  };

  return (
    <div style={{minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24}}>
      <div style={{width:"100%", maxWidth:400, animation:"fadeUp 0.4s ease"}}>
        <div style={{textAlign:"center", marginBottom:32}}>
          <div style={{fontSize:42, fontWeight:800, color:G.text, letterSpacing:"-0.03em"}}>No<span style={{color:G.accent}}>Spoilers</span></div>
          <div style={{fontSize:13, color:G.muted, marginTop:6}}>Set a new password</div>
        </div>
        <div style={{background:G.surface, borderRadius:20, padding:"28px 24px"}}>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            <div style={{position:"relative"}}>
              <input className="auth-input" style={{paddingRight:42}} type={showPw ? "text" : "password"} placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}/>
              <button onClick={() => setShowPw(!showPw)} style={{position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:16, color:G.dim, padding:2}}>{showPw ? "🙈" : "👁"}</button>
            </div>
            <input className="auth-input" type={showPw ? "text" : "password"} placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}/>
          </div>

          {err && <div style={{marginTop:12, padding:"9px 12px", background:"rgba(229,57,53,0.1)", border:"1px solid rgba(229,57,53,0.25)", borderRadius:8, fontSize:12, color:G.red}}>{err}</div>}

          <button onClick={submit} disabled={loading} style={{width:"100%", marginTop:18, padding:"12px", background:G.accent, color:"#000", borderRadius:10, fontSize:14, fontWeight:700, border:"none", opacity:loading?0.75:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
            {loading ? <><Spinner size={15}/>Updating…</> : "Set New Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
