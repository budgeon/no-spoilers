import { useState, useEffect } from "react";
import { G } from "../constants/tokens.js";
import { REACTIONS } from "../constants/mockData.js";
import { loadComments, postComment, deleteComment, toggleCommentLike } from "../lib/db.js";
import Center from "../components/Center.jsx";
import Pill from "../components/Pill.jsx";
import { useMinLoading } from "../hooks/useMinLoading.js";

const CommentSkeleton = () => (
  <div style={{display:"flex", gap:10, padding:"12px 0", borderBottom:`1px solid ${G.border}`}}>
    <div style={{width:32, height:32, borderRadius:"50%", flexShrink:0}} className="poster-img-wrap"/>
    <div style={{flex:1, display:"flex", flexDirection:"column", gap:6, paddingTop:2}}>
      <div style={{height:11, width:"35%", borderRadius:4}} className="poster-img-wrap"/>
      <div style={{height:13, width:"85%", borderRadius:4}} className="poster-img-wrap"/>
      <div style={{height:13, width:"60%", borderRadius:4}} className="poster-img-wrap"/>
    </div>
  </div>
);

const timeAgo = ts => { const s = Math.floor((Date.now()-ts)/1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; };

export default function CommentsSheet({showId, ep, user, onClose}) {
  const [comments, setComments] = useState([]);
  const { loading, begin, finish } = useMinLoading();
  const [text, setText] = useState("");
  const [reaction, setReaction] = useState(null);
  const [spoiler, setSpoiler] = useState(false);
  const [revealed, setRevealed] = useState({});

  const refresh = async () => {
    const data = await loadComments(showId, ep.id);
    setComments(data);
    return data;
  };

  useEffect(() => {
    begin();
    refresh().then(() => finish());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId, ep.id]);

  const submit = async () => {
    if (!text.trim() && !reaction) return;
    await postComment(user.id, showId, ep.id, { text: text.trim(), reaction, spoiler });
    setText(""); setReaction(null); setSpoiler(false);
    await refresh();
  };

  const handleLike = async (c) => {
    const newLikedBy = await toggleCommentLike(c.id, user.id, c.likedBy);
    setComments(prev => prev.map(x => x.id !== c.id ? x : {...x, likedBy: newLikedBy, likes: newLikedBy.length}));
  };

  const handleDelete = async (id) => {
    await deleteComment(id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleClose = () => onClose(comments);

  return (
    <div className="overlay overlay-comments" onClick={handleClose}>
      <div className="sheet sheet-comments" onClick={e => e.stopPropagation()}>
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 20px 0"}}>
          <div className="sheet-handle"/>
          <div style={{width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:12, borderBottom:`1px solid ${G.border}`}}>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:G.text}}>{ep.episode_number != null ? `E${ep.episode_number} · ${ep.name}` : ep.name}</div>
              <div style={{fontSize:11, color:G.muted, marginTop:2}}>{comments.length} comments</div>
            </div>
            <button onClick={handleClose} style={{color:G.muted, fontSize:18, padding:4}}>✕</button>
          </div>
        </div>

        <div style={{flex:1, overflowY: loading ? "hidden" : "auto", padding:"12px 20px"}}>
          {loading
            ? <>{Array.from({length:5}).map((_,i) => <CommentSkeleton key={i}/>)}</>
            : comments.length === 0
              ? <Center><div style={{textAlign:"center", color:G.dim, fontSize:13}}>No comments yet.<br/>Be the first to react!</div></Center>
              : comments.map(c => {
                  const isOwn = c.userId === user.id;
                  const liked = c.likedBy.includes(user.id);
                  return (
                    <div key={c.id} style={{display:"flex", gap:10, marginBottom:16}}>
                      <div className="avatar avatar-md">{c.avatar}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap"}}>
                          <span style={{fontSize:13, fontWeight:600}}>{c.userName}</span>
                          {c.reaction && <span style={{fontSize:16}}>{c.reaction}</span>}
                          <span style={{fontSize:11, color:G.dim}}>{timeAgo(c.createdAt)}</span>
                          {c.spoiler && <Pill label="SPOILER"/>}
                        </div>
                        {c.text && (
                          <div style={{position:"relative"}}>
                            <div style={{fontSize:13, color:G.muted, lineHeight:1.5, filter: c.spoiler && !revealed[c.id] ? "blur(6px)" : "none", transition:"filter 0.2s"}}>{c.text}</div>
                            {c.spoiler && !revealed[c.id] && <button onClick={() => setRevealed(r => ({...r, [c.id]: true}))} style={{position:"absolute", inset:0, width:"100%", background:"transparent", border:"none", cursor:"pointer", fontSize:12, color:G.accent, fontWeight:600}}>Tap to reveal spoiler</button>}
                          </div>
                        )}
                        <div style={{display:"flex", gap:12, marginTop:6}}>
                          <button onClick={() => handleLike(c)} style={{fontSize:12, color: liked ? G.accent : G.dim, display:"flex", alignItems:"center", gap:4}}>
                            {liked ? "♥" : "♡"}{c.likes > 0 && ` ${c.likes}`}
                          </button>
                          {isOwn && <button onClick={() => handleDelete(c.id)} style={{fontSize:12, color:G.dim}}>Delete</button>}
                        </div>
                      </div>
                    </div>
                  );
                })
          }
        </div>

        <div style={{padding:"12px 20px", borderTop:`1px solid ${G.border}`, background:G.surface}}>
          <div style={{display:"flex", gap:6, marginBottom:10, flexWrap:"wrap"}}>
            {REACTIONS.map(r => (
              <button key={r} onClick={() => setReaction(reaction === r ? null : r)} className={`reaction-btn${reaction === r ? " active" : ""}`}>{r}</button>
            ))}
          </div>
          <div style={{display:"flex", gap:10, alignItems:"flex-end"}}>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment…" rows={2} style={{flex:1, background:G.surface2, border:`1px solid ${G.border}`, borderRadius:10, padding:"8px 12px", color:G.text, fontSize:13, resize:"none", lineHeight:1.5}}/>
            <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end"}}>
              <label style={{display:"flex", alignItems:"center", gap:4, fontSize:11, color:G.muted, cursor:"pointer"}}>
                <input type="checkbox" checked={spoiler} onChange={e => setSpoiler(e.target.checked)} style={{accentColor:G.accent, width:12, height:12}}/>Spoiler
              </label>
              <button onClick={submit} disabled={!text.trim() && !reaction} style={{padding:"8px 16px", background: (!text.trim() && !reaction) ? "rgba(255,255,255,0.06)" : G.accent, color: (!text.trim() && !reaction) ? G.dim : "#000", borderRadius:8, fontSize:13, fontWeight:600, border:"none", transition:"all 0.15s"}}>Post</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
