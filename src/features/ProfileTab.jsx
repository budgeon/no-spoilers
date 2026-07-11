import { useMemo } from "react";
import { G } from "../constants/tokens.js";
import { GENRE_MAP } from "../constants/mockData.js";
import Center from "../components/Center.jsx";
import ProgressBar from "../components/ProgressBar.jsx";

function StatBox({label, value, sub}) {
  return (
    <div className="stat-box">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function ProfileTab({user, watched, ratings, watchlist, epTotals, onLogout, onImport}) {
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
  const daysWatched = useMemo(() => ((epCount * 45) / 60 / 24).toFixed(1), [epCount]);
  const topGenres = useMemo(() => {
    const genreCounts = {};
    titles.forEach(t => (t.genre_ids || []).forEach(gid => { const n = GENRE_MAP[gid]; if (n) genreCounts[n] = (genreCounts[n] || 0) + 1; }));
    return Object.entries(genreCounts).sort((a,b) => b[1]-a[1]).slice(0,5);
  }, [titles]);

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:24, padding:"20px 0"}}>
        <div className="avatar avatar-lg">{user.avatar}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:20, fontWeight:700, color:G.text}}>{user.name}</div>
          <div style={{fontSize:13, color:G.muted, marginTop:2}}>{user.email}</div>
          <div style={{fontSize:12, color:G.dim, marginTop:4}}>Member since {new Date(user.joinedAt).toLocaleDateString("en-US", {month:"long", year:"numeric"})}</div>
        </div>
      </div>

      <div style={{background:`linear-gradient(135deg,${G.accentDim},rgba(107,140,174,0.03))`, border:`1px solid rgba(107,140,174,0.2)`, borderRadius:16, padding:"20px", marginBottom:16, textAlign:"center"}}>
        <div style={{fontSize:42, fontWeight:700, color:G.accent, lineHeight:1}}>{daysWatched}</div>
        <div style={{fontSize:14, color:G.muted, marginTop:4}}>days of TV watched</div>
        <div style={{fontSize:11, color:G.dim, marginTop:2}}>{epCount} episodes · {mvCount} movies</div>
      </div>

      <div style={{display:"flex", gap:10, marginBottom:16}}>
        <StatBox label="TV Shows" value={tvCount}/>
        <StatBox label="Movies" value={mvCount}/>
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
          {label: "📥 Import from TV Time", action: onImport, color: G.accent},
          {label: "↪ Sign out", action: onLogout, color: G.red},
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="profile-action" style={{color: item.color, borderTop: i > 0 ? `1px solid ${G.border}` : "none"}}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
