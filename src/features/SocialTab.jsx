import { useState, useEffect, useCallback, useRef } from "react";
import { G } from "../constants/tokens.js";
import { fetchActivityFeed, fetchFollowCounts, fetchFollowing, followUser, unfollowUser, searchProfiles } from "../lib/db.js";
import Center from "../components/Center.jsx";
import Spinner from "../components/Spinner.jsx";

const timeAgo = ts => { const s = Math.floor((Date.now()-ts)/1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; };

function FeedItem({ item, onUserTap }) {
  const label = item.type === "episode"
    ? `watched S${item.season}E${item.episode}${item.showName ? ` of ${item.showName}` : ""}`
    : `watched ${item.name}`;
  const icon = item.type === "movie" ? "🎬" : "📺";
  return (
    <div style={{display:"flex", gap:12, padding:"12px 0", borderBottom:`1px solid ${G.border}`}}>
      <button onClick={() => onUserTap({id:item.userId, name:item.userName, avatar:item.avatar})}
        style={{background:"none", border:"none", padding:0, flexShrink:0}}>
        <div className="avatar avatar-md">{item.avatar}</div>
      </button>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, color:G.text, lineHeight:1.4}}>
          <span style={{fontWeight:600}}>{item.userName}</span>{" "}{label}{" "}<span style={{fontSize:16}}>{icon}</span>
        </div>
        <div style={{fontSize:11, color:G.dim, marginTop:3}}>{timeAgo(item.watchedAt)}</div>
      </div>
    </div>
  );
}

export default function SocialTab({ user, watched, onViewProfile }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ following: 0, followers: 0 });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [followError, setFollowError] = useState(null);
  const searchAc = useRef(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const [feedData, countsData, followingList] = await Promise.all([
      fetchActivityFeed(user.id),
      fetchFollowCounts(user.id),
      fetchFollowing(user.id),
    ]);
    setFeed(feedData);
    setCounts(countsData);
    setFollowedIds(new Set(followingList.map(f => f.id)));
    setLoading(false);
  }, [user.id]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!searchQuery.trim()) { setSearchResults([]); return; }
      setSearching(true);
      const results = await searchProfiles(searchQuery, user.id);
      setSearchResults(results);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, user.id]);

  const handleFollow = async (targetId) => {
    setFollowError(null);
    try {
      const newSet = new Set(followedIds);
      if (newSet.has(targetId)) { newSet.delete(targetId); await unfollowUser(user.id, targetId); }
      else { newSet.add(targetId); await followUser(user.id, targetId); }
      setFollowedIds(newSet);
      const newCounts = await fetchFollowCounts(user.id);
      setCounts(newCounts);
      if (!showSearch) loadFeed();
    } catch {
      setFollowError("Couldn't update follow. Please try again.");
      setTimeout(() => setFollowError(null), 3000);
    }
  };

  if (loading) return <Center py={120}><Spinner/></Center>;

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingTop:4}}>
        <div style={{display:"flex", gap:24}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:18, fontWeight:700, color:G.accent}}>{counts.following}</div>
            <div style={{fontSize:11, color:G.muted}}>Following</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:18, fontWeight:700, color:G.accent}}>{counts.followers}</div>
            <div style={{fontSize:11, color:G.muted}}>Followers</div>
          </div>
        </div>
        <button
          onClick={() => { setShowSearch(s => !s); setSearchQuery(""); setSearchResults([]); }}
          style={{padding:"8px 16px", background: showSearch ? G.surface2 : G.accent, color: showSearch ? G.muted : "#000", borderRadius:20, fontSize:12, fontWeight:600, border:`1px solid ${G.border}`}}>
          {showSearch ? "✕ Close" : "Find Friends"}
        </button>
      </div>

      {showSearch && (
        <div style={{marginBottom:16}}>
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name…" className="search-input"/>
          </div>
          {searching && <Center py={24}><Spinner/></Center>}
          {searchResults.map(p => (
            <div key={p.id} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${G.border}`}}>
              <button onClick={() => onViewProfile(p)} style={{background:"none", border:"none", padding:0}}>
                <div className="avatar avatar-md">{p.avatar}</div>
              </button>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:600, color:G.text}}>{p.name}</div>
                <div style={{fontSize:11, color:G.dim}}>Joined {new Date(p.joinedAt).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</div>
              </div>
              <button onClick={() => handleFollow(p.id)}
                style={{padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, flexShrink:0,
                  border:`1px solid ${followedIds.has(p.id) ? G.border2 : G.accent}`,
                  background: followedIds.has(p.id) ? "transparent" : G.accent,
                  color: followedIds.has(p.id) ? G.muted : "#000"}}>
                {followedIds.has(p.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
          {!searching && searchQuery.trim() && !searchResults.length && (
            <Center py={32}><div style={{fontSize:13, color:G.dim}}>No users found.</div></Center>
          )}
        </div>
      )}

      {followError && (
        <div style={{background:G.red, color:"#fff", borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:12}}>{followError}</div>
      )}

      {!showSearch && (
        <>
          <div className="section-label">FRIENDS' ACTIVITY</div>
          {feed.length === 0
              ? <Center py={80}><div style={{textAlign:"center", color:G.dim, fontSize:13}}>
                  {counts.following === 0 ? "Follow some friends to see their activity here." : "No recent activity from people you follow."}
                </div></Center>
              : feed.map((item, i) => <FeedItem key={`${item.userId}_${item.itemKey}_${i}`} item={item} watched={watched} onUserTap={onViewProfile}/>)
          }
        </>
      )}
    </div>
  );
}
