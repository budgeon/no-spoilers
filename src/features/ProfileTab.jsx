import { useState, useMemo } from "react";
import { G } from "../constants/tokens.js";
import { GENRE_MAP } from "../constants/mockData.js";
import { Auth, AVATARS } from "../auth/Auth.js";
import { updateProfile } from "../lib/db.js";
import Center from "../components/Center.jsx";
import ProgressBar from "../components/ProgressBar.jsx";

function StatBox({label, value, sub, onClick}) {
  return (
    <div className="stat-box" onClick={onClick} style={{cursor: onClick ? "pointer" : undefined}}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function ProfileTab({user, watched, ratings, watchlist, epTotals, onLogout, onImport, onProfileUpdate, onNavigate}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwFields, setPwFields] = useState({ pw: "", pw2: "" });
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const titles = useMemo(
    () => Object.entries(watched).filter(([k]) => !k.startsWith("ep_")).map(([,v]) => v).filter(Boolean),
    [watched]
  );
  const epCount = useMemo(
    () => Object.keys(watched).filter(k => k.startsWith("ep_")).length,
    [watched]
  );
  const tvCount = useMemo(() => titles.filter(t => t.type === "tv").length, [titles]);
  const mvCount = useMemo(() => titles.filter(t => t.type === "movie").length, [titles]);
  const avg = useMemo(() => {
    const rv = Object.values(ratings).filter(Boolean);
    return rv.length ? (rv.reduce((a,b) => a+b, 0) / rv.length).toFixed(1) : null;
  }, [ratings]);
  const tvMinutes = useMemo(
    () => Object.entries(watched).filter(([k]) => k.startsWith("ep_")).reduce((sum, [, ep]) => sum + (ep.runtime > 0 ? ep.runtime : 45), 0),
    [watched]
  );
  const tvDays = useMemo(() => (tvMinutes / 60 / 24).toFixed(1), [tvMinutes]);
  const movieMinutes = useMemo(
    () => titles.filter(t => t.type === "movie").reduce((sum, m) => sum + (m.runtime > 0 ? m.runtime : 100), 0),
    [titles]
  );
  const movieDays = useMemo(() => (movieMinutes / 60 / 24).toFixed(1), [movieMinutes]);
  const topGenres = useMemo(() => {
    const genreCounts = {};
    titles.forEach(t => (t.genre_ids || []).forEach(gid => { const n = GENRE_MAP[gid]; if (n) genreCounts[n] = (genreCounts[n] || 0) + 1; }));
    return Object.entries(genreCounts).sort((a,b) => b[1]-a[1]).slice(0,5);
  }, [titles]);

  const startEdit = () => { setDraftName(user.name); setDraftAvatar(user.avatar); setEditing(true); setSaveError(null); };
  const cancelEdit = () => { setEditing(false); setSaveError(null); };

  const saveProfile = async () => {
    if (!draftName.trim()) return;
    setSaving(true); setSaveError(null);
    try {
      await updateProfile(user.id, { name: draftName.trim(), avatar: draftAvatar });
      onProfileUpdate({ name: draftName.trim(), avatar: draftAvatar });
      setEditing(false);
    } catch {
      setSaveError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (pwFields.pw !== pwFields.pw2) { setPwError("Passwords don't match."); return; }
    if (pwFields.pw.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    setSaving(true); setPwError(null);
    try {
      const { error } = await Auth.updatePassword(pwFields.pw);
      if (error) throw error;
      setPwSuccess(true); setChangingPassword(false); setPwFields({ pw: "", pw2: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) {
      setPwError(e.message || "Couldn't update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {editing ? (
        <div style={{marginBottom:24, padding:"20px 0"}}>
          <div style={{display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:16}}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setDraftAvatar(a)}
                style={{fontSize:24, padding:"8px 0", borderRadius:10, border:`2px solid ${draftAvatar===a ? G.accent : G.border}`, background: draftAvatar===a ? G.accentDim : "transparent", transition:"all 0.1s"}}>
                {a}
              </button>
            ))}
          </div>
          <input value={draftName} onChange={e => setDraftName(e.target.value)}
            placeholder="Display name"
            style={{width:"100%", background:G.surface2, border:`1px solid ${G.border}`, borderRadius:10, padding:"10px 14px", color:G.text, fontSize:14, marginBottom:10, boxSizing:"border-box"}}/>
          {saveError && <div style={{color:G.red, fontSize:12, marginBottom:8}}>{saveError}</div>}
          <div style={{display:"flex", gap:8}}>
            <button onClick={cancelEdit} style={{flex:1, padding:"10px 0", borderRadius:10, border:`1px solid ${G.border2}`, background:"transparent", color:G.muted, fontSize:13, fontWeight:600}}>Cancel</button>
            <button onClick={saveProfile} disabled={saving || !draftName.trim()}
              style={{flex:2, padding:"10px 0", borderRadius:10, border:"none", background:(!draftName.trim()||saving)?G.surface2:G.accent, color:(!draftName.trim()||saving)?G.dim:"#000", fontSize:13, fontWeight:700, transition:"all 0.15s"}}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:24, padding:"20px 0"}}>
          <div className="avatar avatar-lg">{user.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:20, fontWeight:700, color:G.text}}>{user.name}</div>
            <div style={{fontSize:13, color:G.muted, marginTop:2}}>{user.email}</div>
            <div style={{fontSize:12, color:G.dim, marginTop:4}}>Member since {new Date(user.joinedAt).toLocaleDateString("en-US", {month:"long", year:"numeric"})}</div>
          </div>
          <button onClick={startEdit} style={{width:32, height:32, borderRadius:"50%", border:`1px solid ${G.border2}`, background:"transparent", color:G.muted, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>✏️</button>
        </div>
      )}

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16}}>
        <div style={{background:`linear-gradient(135deg,${G.accentDim},rgba(107,140,174,0.03))`, border:`1px solid rgba(107,140,174,0.2)`, borderRadius:16, padding:"16px", textAlign:"center"}}>
          <div style={{fontSize:36, fontWeight:700, color:G.accent, lineHeight:1}}>{tvDays}</div>
          <div style={{fontSize:13, color:G.muted, marginTop:4}}>days of TV</div>
          <div style={{fontSize:11, color:G.dim, marginTop:2}}>{epCount} episodes</div>
        </div>
        <div style={{background:`linear-gradient(135deg,${G.accentDim},rgba(107,140,174,0.03))`, border:`1px solid rgba(107,140,174,0.2)`, borderRadius:16, padding:"16px", textAlign:"center"}}>
          <div style={{fontSize:36, fontWeight:700, color:G.accent, lineHeight:1}}>{movieDays}</div>
          <div style={{fontSize:13, color:G.muted, marginTop:4}}>days of movies</div>
          <div style={{fontSize:11, color:G.dim, marginTop:2}}>{mvCount} movies</div>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16}}>
        <StatBox label="TV Shows" value={tvCount} onClick={() => onNavigate("shows")}/>
        <StatBox label="Movies" value={mvCount} onClick={() => onNavigate("movies")}/>
        <StatBox label="Avg Rating" value={avg ? `${avg}★` : "—"}/>
        <StatBox label="Watchlist" value={Object.keys(watchlist).length}/>
      </div>

      {topGenres.length > 0 && (
        <div style={{background:G.surface, borderRadius:12, padding:"16px", marginBottom:16}}>
          <div className="section-label">TOP GENRES</div>
          {topGenres.map(([g, c]) => (
            <div key={g} style={{marginBottom:10}}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                <span style={{fontSize:13, color:G.text}}>{g}</span>
                <span style={{fontSize:12, color:G.muted}}>{c}</span>
              </div>
              <ProgressBar value={c} max={topGenres[0][1]} h={3}/>
            </div>
          ))}
        </div>
      )}

      <div style={{background:G.surface, borderRadius:12, overflow:"hidden", marginBottom:16}}>
        {[
          {icon:"📥", text:"Import from TV Time",  action:onImport,                           color:G.accent},
          {icon:"🔒", text:"Change Password",       action:()=>setChangingPassword(true),      color:G.text},
          {icon:"↪",  text:"Sign out",              action:onLogout,                           color:G.red},
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="profile-action" style={{color:item.color, borderTop:i>0?`1px solid ${G.border}`:"none"}}>
            <span style={{flexShrink:0}}>{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>

      {changingPassword && (
        <div style={{background:G.surface, borderRadius:12, padding:16, marginBottom:16}}>
          <div style={{fontSize:13, fontWeight:600, color:G.text, marginBottom:12}}>Change Password</div>
          <input type="password" placeholder="New password" value={pwFields.pw}
            onChange={e => setPwFields(f => ({...f, pw:e.target.value}))}
            style={{width:"100%", background:G.surface2, border:`1px solid ${G.border}`, borderRadius:10, padding:"10px 14px", color:G.text, fontSize:13, marginBottom:8, boxSizing:"border-box"}}/>
          <input type="password" placeholder="Confirm password" value={pwFields.pw2}
            onChange={e => setPwFields(f => ({...f, pw2:e.target.value}))}
            style={{width:"100%", background:G.surface2, border:`1px solid ${G.border}`, borderRadius:10, padding:"10px 14px", color:G.text, fontSize:13, marginBottom:10, boxSizing:"border-box"}}/>
          {pwError && <div style={{color:G.red, fontSize:12, marginBottom:8}}>{pwError}</div>}
          <div style={{display:"flex", gap:8}}>
            <button onClick={() => { setChangingPassword(false); setPwFields({pw:"",pw2:""}); setPwError(null); }}
              style={{flex:1, padding:"10px 0", borderRadius:10, border:`1px solid ${G.border2}`, background:"transparent", color:G.muted, fontSize:13, fontWeight:600}}>Cancel</button>
            <button onClick={savePassword} disabled={saving || !pwFields.pw}
              style={{flex:2, padding:"10px 0", borderRadius:10, border:"none", background:(!pwFields.pw||saving)?G.surface2:G.accent, color:(!pwFields.pw||saving)?G.dim:"#000", fontSize:13, fontWeight:700}}>
              {saving ? "Saving…" : "Update Password"}
            </button>
          </div>
        </div>
      )}
      {pwSuccess && <div style={{color:G.success, fontSize:13, marginBottom:12, textAlign:"center"}}>Password updated successfully.</div>}
    </div>
  );
}
