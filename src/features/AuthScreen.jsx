import { useState } from "react";
import { G } from "../constants/tokens.js";
import { Auth } from "../auth/Auth.js";
import Spinner from "../components/Spinner.jsx";

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const friendlyError = (error) => {
    const msg = error?.message || "";
    const code = error?.code || "";
    if (code === "invalid_credentials" || msg.includes("Invalid login credentials")) return "Incorrect email or password.";
    if (code === "user_already_exists" || msg.includes("already registered") || msg.includes("already exists")) return "An account with this email already exists. Sign in instead?";
    if (msg.includes("Email not confirmed")) return "Please confirm your email before signing in.";
    if (msg.includes("Password should be")) return "Password must be at least 6 characters.";
    if (msg.includes("Unable to validate email")) return "Please enter a valid email address.";
    return msg || "Something went wrong. Please try again.";
  };

  const submit = async () => {
    setErr("");
    if (!email.trim() || !pw.trim()) { setErr("Please fill all fields."); return; }
    if (mode === "signup" && !name.trim()) { setErr("Please enter your name."); return; }
    if (pw.length < 6) { setErr("Password must be 6+ characters."); return; }
    setLoading(true);
    const { data, error } = mode === "signup"
      ? await Auth.signup(email.trim().toLowerCase(), name.trim(), pw)
      : await Auth.login(email.trim().toLowerCase(), pw);
    setLoading(false);
    if (error) {
      setErr(friendlyError(error));
      if (error.code === "user_already_exists" || error.message?.includes("already registered")) setMode("login");
    } else if (mode === "signup" && data?.user?.identities?.length === 0) {
      setErr("This email is already registered. Try signing in instead.");
      setMode("login");
    } else if (mode === "signup" && data?.session === null) {
      setConfirmSent(true);
    }
  };

  const handleGoogle = () => { setGLoading(true); Auth.google(); };

  const handleForgot = async () => {
    setErr("");
    if (!email.trim()) { setErr("Enter your email above first."); return; }
    setLoading(true);
    const { error } = await Auth.resetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (error?.status === 429) { setErr("Too many attempts — please wait a minute and try again."); return; }
    setResetSent(true);
  };

  if (confirmSent) return (
    <div style={{minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24}}>
      <div style={{textAlign:"center", maxWidth:360}}>
        <div style={{fontSize:48, marginBottom:16}}>📬</div>
        <div style={{fontSize:20, fontWeight:700, color:G.text, marginBottom:8}}>Check your email</div>
        <div style={{fontSize:13, color:G.muted, lineHeight:1.6, marginBottom:24}}>We sent a confirmation link to <strong style={{color:G.text}}>{email}</strong>. Click it to activate your account, then come back and sign in.</div>
        <button onClick={() => { setConfirmSent(false); setMode("login"); }} style={{padding:"10px 24px", background:G.accent, color:"#000", borderRadius:10, fontSize:13, fontWeight:700, border:"none"}}>Back to Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24}}>
      <div style={{position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none"}}>
        <div style={{position:"absolute", top:"-15%", right:"-10%", width:400, height:400, borderRadius:"50%", background:"rgba(107,140,174,0.1)", filter:"blur(80px)"}}/>
        <div style={{position:"absolute", bottom:"-10%", left:"-10%", width:350, height:350, borderRadius:"50%", background:"rgba(107,140,174,0.06)", filter:"blur(60px)"}}/>
      </div>
      <div style={{width:"100%", maxWidth:400, position:"relative", animation:"fadeUp 0.4s ease"}}>
        <div style={{textAlign:"center", marginBottom:32}}>
          <div style={{fontSize:42, fontWeight:800, color:G.text, letterSpacing:"-0.03em"}}>No<span style={{color:G.accent}}>Spoilers</span></div>
          <div style={{fontSize:13, color:G.muted, marginTop:6}}>Track shows & movies with your community</div>
        </div>
        <div style={{background:G.surface, borderRadius:20, padding:"28px 24px"}}>
          <div style={{display:"flex", background:G.bg, borderRadius:10, padding:3, marginBottom:22, gap:2}}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }} className={`auth-mode-btn${mode === m ? " active" : ""}`}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <button onClick={handleGoogle} disabled={gLoading} style={{width:"100%", padding:"11px", borderRadius:10, border:`1px solid ${G.border}`, background:G.surface2, color:G.text, fontSize:13, fontWeight:500, marginBottom:18, display:"flex", alignItems:"center", justifyContent:"center", gap:10, opacity:gLoading?0.7:1}}>
            {gLoading ? <Spinner size={16}/> : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
            {gLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:18}}>
            <div style={{flex:1, height:1, background:G.border}}/>
            <span style={{fontSize:11, color:G.dim}}>OR</span>
            <div style={{flex:1, height:1, background:G.border}}/>
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {mode === "signup" && <input className="auth-input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}/>}
            <input className="auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}/>
            <div style={{position:"relative"}}>
              <input className="auth-input" style={{paddingRight:42}} type={showPw ? "text" : "password"} placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}/>
              <button onClick={() => setShowPw(!showPw)} style={{position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:16, color:G.dim, padding:2}}>{showPw ? "🙈" : "👁"}</button>
            </div>
          </div>

          {err && <div style={{marginTop:12, padding:"9px 12px", background:"rgba(229,57,53,0.1)", border:"1px solid rgba(229,57,53,0.25)", borderRadius:8, fontSize:12, color:G.red}}>{err}</div>}

          <button onClick={submit} disabled={loading} style={{width:"100%", marginTop:18, padding:"12px", background:G.accent, color:"#000", borderRadius:10, fontSize:14, fontWeight:700, border:"none", opacity:loading?0.75:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
            {loading ? <><Spinner size={15}/>{mode === "signup" ? "Creating…" : "Signing in…"}</> : (mode === "signup" ? "Create Account" : "Sign In")}
          </button>

          <div style={{textAlign:"center", marginTop:14, fontSize:12, color:G.dim}}>
            {mode === "login"
              ? <>No account? <button onClick={() => { setMode("signup"); setErr(""); }} style={{color:G.accent, background:"none", border:"none", fontSize:12, fontWeight:500}}>Sign up free</button></>
              : <>Have an account? <button onClick={() => { setMode("login"); setErr(""); }} style={{color:G.accent, background:"none", border:"none", fontSize:12, fontWeight:500}}>Sign in</button></>
            }
          </div>
          {mode === "login" && (
            <div style={{textAlign:"center", marginTop:8, fontSize:12}}>
              {resetSent
                ? <span style={{color:G.success}}>Reset link sent — check your email.</span>
                : <button onClick={handleForgot} disabled={loading} style={{color:G.dim, background:"none", border:"none", fontSize:12}}>Forgot password?</button>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
