import { useState, useEffect } from "react";
import { G } from "../constants/tokens.js";
import { fetchFollowing, fetchFollowers, isFollowing, followUser, unfollowUser } from "../lib/db.js";
import { useMinLoading } from "../hooks/useMinLoading.js";

const SkeletonRow = () => (
  <div style={{display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:`1px solid ${G.border}`}}>
    <div style={{width:32, height:32, borderRadius:"50%", flexShrink:0}} className="poster-img-wrap"/>
    <div style={{flex:1, display:"flex", flexDirection:"column", gap:6}}>
      <div style={{height:13, width:"45%", borderRadius:6}} className="poster-img-wrap"/>
      <div style={{height:10, width:"30%", borderRadius:6}} className="poster-img-wrap"/>
    </div>
    <div style={{width:72, height:28, borderRadius:20}} className="poster-img-wrap"/>
  </div>
);

export default function FollowListSheet({ userId, type, currentUser, onClose, onViewProfile, onFollowChange }) {
  const [users, setUsers] = useState([]);
  const { loading, finish } = useMinLoading();
  const [followedIds, setFollowedIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      const list = type === "following"
        ? await fetchFollowing(userId)
        : await fetchFollowers(userId);
      setUsers(list);
      const checks = await Promise.all(list.map(u => isFollowing(currentUser.id, u.id)));
      setFollowedIds(new Set(list.filter((_, i) => checks[i]).map(u => u.id)));
      finish();
    })();
  }, [userId, type, currentUser.id]);

  const toggle = async (u) => {
    const already = followedIds.has(u.id);
    if (already) {
      await unfollowUser(currentUser.id, u.id);
      setFollowedIds(prev => { const s = new Set(prev); s.delete(u.id); return s; });
    } else {
      await followUser(currentUser.id, u.id);
      setFollowedIds(prev => new Set([...prev, u.id]));
    }
    onFollowChange?.();
  };

  return (
    <div className="overlay overlay-comments" style={{zIndex:350}} onClick={onClose}>
      <div className="sheet sheet-comments" onClick={e => e.stopPropagation()} style={{padding:"16px 0 0", height:"65vh"}}>
        <div style={{padding:"0 16px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${G.border}`}}>
          <div style={{fontSize:15, fontWeight:700, color:G.text}}>
            {type === "following" ? "Following" : "Followers"}
          </div>
          <button onClick={onClose} style={{fontSize:20, color:G.dim}}>✕</button>
        </div>
        {loading
          ? <div style={{overflowY:"hidden", flex:1}}>
              {Array.from({length:5}).map((_, i) => <SkeletonRow key={i}/>)}
            </div>
          : users.length === 0
            ? <div style={{padding:40, textAlign:"center", fontSize:13, color:G.muted}}>
                {type === "following" ? "Not following anyone yet." : "No followers yet."}
              </div>
            : <div style={{overflowY:"auto", flex:1}}>
                {users.map(u => (
                  <div key={u.id} style={{display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:`1px solid ${G.border}`}}>
                    <button onClick={() => { onClose(); onViewProfile(u); }} style={{display:"flex", alignItems:"center", gap:12, flex:1, background:"none", border:"none", textAlign:"left"}}>
                      <div className="avatar avatar-sm">{u.avatar}</div>
                      <div>
                        <div style={{fontSize:14, fontWeight:600, color:G.text}}>{u.name}</div>
                        <div style={{fontSize:11, color:G.dim}}>Joined {new Date(u.joinedAt).toLocaleDateString("en-US", {month:"short", year:"numeric"})}</div>
                      </div>
                    </button>
                    {u.id !== currentUser.id && (
                      <button onClick={() => toggle(u)} style={{padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, flexShrink:0, border:`1px solid ${followedIds.has(u.id) ? G.border2 : G.accent}`, background: followedIds.has(u.id) ? "transparent" : G.accent, color: followedIds.has(u.id) ? G.muted : "#000"}}>
                        {followedIds.has(u.id) ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  );
}
