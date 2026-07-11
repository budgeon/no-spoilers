import { useState } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import { REACTIONS } from "../constants/mockData.js";
import Center from "../components/Center.jsx";
import Pill from "../components/Pill.jsx";
import Spinner from "../components/Spinner.jsx";

const timeAgo = ts => { const s = Math.floor((Date.now()-ts)/1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; };

export default function CommentsSheet({showId, ep, user, onClose}) {
  const key = `show${showId}_ep${ep.id}`;
  const [comments, setComments] = useState(() => LS.get(SK.C, {})[key] || []);
  const [text, setText] = useState("");
  const [reaction, setReaction] = useState(null);
  const [spoiler, setSpoiler] = useState(false);
  const [revealed, setRevealed] = useState({});

  const save = updated => { const all = LS.get(SK.C, {}); all[key] = updated; LS.set(SK.C, all); setComments(updated); };
  const submit = () => {
    if (!text.trim() && !reaction) return;
    save([...comments, {id: Date.now(), userId: user.id, userName: user.name, avatar: user.avatar, text: text.trim(), reaction, spoiler, likes: 0, likedBy: [], createdAt: Date.now()}]);
    setText(""); setReaction(null); setSpoiler(false);
  };
  const toggleLike = id => save(comments.map(c => c.id !== id ? c : {...c, likes: c.likedBy.includes(user.id) ? c.likes-1 : c.likes+1, likedBy: c.likedBy.includes(user.id) ? c.likedBy.filter(x => x !== user.id) : [...c.likedBy, user.id]}));

  return (
    <div className="overlay overlay-comments" onClick={onClose}>
      <div className="sheet sheet-comments" onClick={e => e.stopPropagation()}>
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 20px 0"}}>
          <div className="sheet-handle"/>
          <div style={{width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:12, borderBottom:`1px solid ${G.border}`}}>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:G.text}}>E{ep.episode_number} · {ep.name}</div>
              <div style={{fontSize:11, color:G.muted, marginTop:2}}>{comments.length} comments</div>
            </div>
            <button onClick={onClose} style={{color:G.muted, fontSize:18, padding:4}}>✕</button>
          </div>
        </div>

        <div style={{flex:1, overflowY:"auto", padding:"12px 20px"}}>
          {comments.length === 0
            ? <Center><div style={{textAlign:"center", color:G.dim, fontSize:13}}>No comments yet.<br/>Be the first to react!</div></Center>
            : [...comments].sort((a,b) => b.createdAt-a.createdAt).map(c => {
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
                        <button onClick={() => toggleLike(c.id)} style={{fontSize:12, color: liked ? G.accent : G.dim, display:"flex", alignItems:"center", gap:4}}>
                          {liked ? "♥" : "♡"}{c.likes > 0 && ` ${c.likes}`}
                        </button>
                        {isOwn && <button onClick={() => save(comments.filter(x => x.id !== c.id))} style={{fontSize:12, color:G.dim}}>Delete</button>}
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
