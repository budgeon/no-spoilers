import { useState, useEffect } from "react";
import { G } from "../constants/tokens.js";
import { fetchPublicProfileStats, fetchFollowCounts, isFollowing, followUser, unfollowUser } from "../lib/db.js";
import Center from "../components/Center.jsx";
import Spinner from "../components/Spinner.jsx";

export default function PublicProfileSheet({ profile, currentUser, onClose }) {
  const [stats, setStats] = useState(null);
  const [counts, setCounts] = useState({ following: 0, followers: 0 });
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [followError, setFollowError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchPublicProfileStats(profile.id),
      fetchFollowCounts(profile.id),
      isFollowing(currentUser.id, profile.id),
    ]).then(([s, c, f]) => { setStats(s); setCounts(c); setFollowing(f); setLoading(false); });
  }, [profile.id, currentUser.id]);

  const handleFollow = async () => {
    setToggling(true);
    setFollowError(null);
    try {
      if (following) {
        await unfollowUser(currentUser.id, profile.id);
        setFollowing(false);
        setCounts(c => ({ ...c, followers: Math.max(0, c.followers - 1) }));
      } else {
        await followUser(currentUser.id, profile.id);
        setFollowing(true);
        setCounts(c => ({ ...c, followers: c.followers + 1 }));
      }
    } catch {
      setFollowError("Couldn't update follow. Please try again.");
      setTimeout(() => setFollowError(null), 3000);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="overlay overlay-profile" onClick={onClose}>
      <div className="sheet sheet-profile" onClick={e => e.stopPropagation()}>
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 20px 0"}}>
          <div className="sheet-handle"/>
          <div style={{width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:16, borderBottom:`1px solid ${G.border}`}}>
            <div style={{display:"flex", alignItems:"center", gap:12}}>
              <div className="avatar avatar-lg">{profile.avatar}</div>
              <div>
                <div style={{fontSize:16, fontWeight:700, color:G.text}}>{profile.name}</div>
                {profile.joinedAt && <div style={{fontSize:11, color:G.dim, marginTop:2}}>Joined {new Date(profile.joinedAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>}
              </div>
            </div>
            <button onClick={onClose} style={{color:G.muted, fontSize:18, padding:4}}>✕</button>
          </div>
        </div>

        <div style={{padding:"20px"}}>
          {loading ? <Center py={60}><Spinner/></Center> : (
            <>
              <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20}}>
                {[{label:"TV Shows",value:stats.shows},{label:"Movies",value:stats.movies},{label:"Episodes",value:stats.episodes}].map(s => (
                  <div key={s.label} className="stat-box">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex", gap:24, justifyContent:"center", marginBottom:20}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16, fontWeight:700, color:G.text}}>{counts.following}</div>
                  <div style={{fontSize:11, color:G.muted}}>Following</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16, fontWeight:700, color:G.text}}>{counts.followers}</div>
                  <div style={{fontSize:11, color:G.muted}}>Followers</div>
                </div>
              </div>
              {followError && (
                <div style={{background:G.red, color:"#fff", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:12}}>{followError}</div>
              )}
              <button onClick={handleFollow} disabled={toggling}
                style={{width:"100%", padding:"12px 0", borderRadius:12, fontSize:14, fontWeight:700,
                  border: following ? `1px solid ${G.border2}` : "none",
                  background: following ? "transparent" : G.accent,
                  color: following ? G.muted : "#000",
                  opacity: toggling ? 0.6 : 1, transition:"all 0.15s"}}>
                {toggling ? "…" : following ? "✓ Following" : "Follow"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
