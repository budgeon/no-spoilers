import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// No Spoilers v1.0
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";
const tmdb = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json();
};
const hasKey = () => TMDB_API_KEY && TMDB_API_KEY !== "YOUR_TMDB_API_KEY_HERE";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const LS = {
  get: (k, fb={}) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
};
const SK = { W:"tt_watched", WL:"tt_watchlist", R:"tt_ratings", U:"tt_user", DB:"tt_users_db", C:"tt_comments", EP:"tt_ep_totals", REC:"tt_recent" };

// ─── DESIGN TOKENS (TV Time palette) ─────────────────────────────────────────
const G = {
  bg:       "#F5F0E8",
  surface:  "#FDFAF4",
  surface2: "#EFE9DC",
  border:   "rgba(80,100,130,0.12)",
  border2:  "rgba(80,100,130,0.22)",
  text:     "#1E2535",
  muted:    "rgba(30,37,53,0.5)",
  dim:      "rgba(30,37,53,0.28)",
  accent:   "#6B8CAE",   // dusty blue
  accentDim:"rgba(107,140,174,0.12)",
  green:    "#5A7A9E",
  red:      "#B85450",
  blue:     "#8AAAC8",
  tabBar:   "#EDE7D8",
  MAX_W:    680,
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_TV = [
  {id:1396,name:"Breaking Bad",media_type:"tv",vote_average:9.5,first_air_date:"2008-01-20",poster_path:null,genre_ids:[18,80],overview:"A chemistry teacher turned drug manufacturer."},
  {id:66732,name:"Stranger Things",media_type:"tv",vote_average:8.7,first_air_date:"2016-07-15",poster_path:null,genre_ids:[18,9648,10765],overview:"A boy disappears and supernatural forces emerge."},
  {id:1399,name:"Game of Thrones",media_type:"tv",vote_average:8.4,first_air_date:"2011-04-17",poster_path:null,genre_ids:[18,10759,10765],overview:"Noble families fight for the Iron Throne."},
  {id:2316,name:"The Office",media_type:"tv",vote_average:8.6,first_air_date:"2005-03-24",poster_path:null,genre_ids:[35],overview:"A mockumentary on office workers."},
  {id:1668,name:"Friends",media_type:"tv",vote_average:8.4,first_air_date:"1994-09-22",poster_path:null,genre_ids:[35],overview:"Six friends navigate life in New York."},
  {id:57243,name:"Doctor Who",media_type:"tv",vote_average:8.3,first_air_date:"2005-03-26",poster_path:null,genre_ids:[10759,18,10765],overview:"A Time Lord travels through time and space."},
];
const MOCK_MOVIES = [
  {id:278,title:"The Shawshank Redemption",media_type:"movie",vote_average:8.7,release_date:"1994-09-23",poster_path:null,genre_ids:[18,80],overview:"Two imprisoned men find redemption."},
  {id:238,title:"The Godfather",media_type:"movie",vote_average:8.7,release_date:"1972-03-14",poster_path:null,genre_ids:[18,80],overview:"A crime dynasty transfers power."},
  {id:13,title:"Forrest Gump",media_type:"movie",vote_average:8.5,release_date:"1994-06-23",poster_path:null,genre_ids:[35,18],overview:"An Alabama man witnesses history."},
  {id:550,title:"Fight Club",media_type:"movie",vote_average:8.4,release_date:"1999-10-15",poster_path:null,genre_ids:[18],overview:"An insomniac forms an underground club."},
];
const GENRE_MAP = {28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",99:"Documentary",18:"Drama",14:"Fantasy",27:"Horror",9648:"Mystery",10749:"Romance",878:"Sci-Fi",53:"Thriller",10759:"Action & Adventure",10765:"Sci-Fi & Fantasy"};
const REACTIONS = ["😂","😭","🤯","❤️","😱","🔥","👏","💀"];
const TV_GENRES=[{id:null,name:"All"},{id:35,name:"Comedy"},{id:18,name:"Drama"},{id:80,name:"Crime"},{id:9648,name:"Mystery"},{id:10765,name:"Sci-Fi"},{id:10759,name:"Action"},{id:16,name:"Animation"},{id:10749,name:"Romance"}];
const MOVIE_GENRES=[{id:null,name:"All"},{id:28,name:"Action"},{id:35,name:"Comedy"},{id:18,name:"Drama"},{id:27,name:"Horror"},{id:878,name:"Sci-Fi"},{id:53,name:"Thriller"},{id:10749,name:"Romance"},{id:80,name:"Crime"}];

// ─── MOCK AUTH ─────────────────────────────────────────────────────────────────
const Auth = {
  get: () => LS.get(SK.U, null),
  signup: (name, email, pw) => {
    const db = LS.get(SK.DB, {}); if (db[email]) return {error:"Account already exists."};
    const u = {id:`u_${Date.now()}`,name,email,avatar:name.slice(0,2).toUpperCase(),joinedAt:Date.now()};
    db[email]={...u,pw}; LS.set(SK.DB,db); LS.set(SK.U,u); return {user:u};
  },
  login: (email,pw) => {
    const db=LS.get(SK.DB,{}); const r=db[email];
    if(!r) return {error:"No account found."}; if(r.pw!==pw) return {error:"Incorrect password."};
    const u={id:r.id,name:r.name,email:r.email,avatar:r.avatar,joinedAt:r.joinedAt}; LS.set(SK.U,u); return {user:u};
  },
  google: () => {
    const names=["Alex Rivera","Jordan Kim","Sam Patel","Casey Morgan","Drew Chen"];
    const name=names[Math.floor(Math.random()*names.length)];
    const email=`${name.toLowerCase().replace(" ",".")}@gmail.com`;
    const db=LS.get(SK.DB,{}); let u;
    if(db[email]) u={id:db[email].id,name:db[email].name,email,avatar:db[email].avatar,joinedAt:db[email].joinedAt,provider:"google"};
    else { u={id:`g_${Date.now()}`,name,email,avatar:name.slice(0,2).toUpperCase(),provider:"google",joinedAt:Date.now()}; db[email]={...u,pw:null}; LS.set(SK.DB,db); }
    LS.set(SK.U,u); return {user:u};
  },
  logout: () => localStorage.removeItem(SK.U),
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;min-height:100vh;}
  body{background:#F5F0E8;color:#1E2535;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;margin:0;}
  input,textarea{outline:none;font-family:inherit;color:#1E2535;}
  button{cursor:pointer;border:none;background:none;color:inherit;font-family:inherit;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
  @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
  @keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(107,140,174,0.2);border-radius:2px;}
  .tab-btn{transition:color 0.15s;}
  .tab-btn.active{color:${G.accent};}
  .tab-btn:not(.active){color:${G.dim};}
  .card-hover{transition:transform 0.15s;cursor:pointer;}
  .card-hover:hover{transform:translateY(-2px);}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const Spinner = ({size=28}) => <div style={{width:size,height:size,border:`2px solid rgba(107,140,174,0.15)`,borderTopColor:G.accent,borderRadius:"50%",animation:"spin 0.7s linear infinite"}} />;
const Center = ({children,py=48}) => <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:`${py}px 0`}}>{children}</div>;
const Pill = ({label,color=G.accent,bg=G.accentDim}) => <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:600,color,background:bg,letterSpacing:"0.04em"}}>{label}</span>;
const timeAgo = ts => { const s=Math.floor((Date.now()-ts)/1000); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m`; if(s<86400)return`${Math.floor(s/3600)}h`; return`${Math.floor(s/86400)}d`; };

function ProgressBar({value,max,color=G.accent,h=3}) {
  const pct = max>0 ? Math.min(100,(value/max)*100) : 0;
  return <div style={{background:"rgba(255,255,255,0.1)",borderRadius:99,overflow:"hidden",height:h}}>
    <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.4s"}} />
  </div>;
}

// ─── POSTER CARD (TV Time style — poster with yellow progress bar) ─────────────
function PosterCard({item,onClick,epProgress,watched,inWL,onWL}) {
  const name = item.name||item.title;
  const type = item.media_type;
  const hasProgress = epProgress&&epProgress.total>0;
  const pct = hasProgress ? Math.round((epProgress.watched/epProgress.total)*100) : 0;
  return (
    <div className="card-hover" onClick={onClick} style={{position:"relative"}}>
      {/* Poster */}
      <div style={{borderRadius:8,overflow:"hidden",background:"#DDD7CC",aspectRatio:"2/3",position:"relative",marginBottom:6}}>
        {item.poster_path
          ? <img src={`${TMDB_IMG}/w300${item.poster_path}`} alt={name} loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(107,140,174,0.3)",fontSize:28}}>{type==="tv"?"📺":"🎬"}</div>
        }
        {/* Watched badge */}
        {watched&&!hasProgress&&<div style={{position:"absolute",top:6,right:6,background:G.green,borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>✓</div>}
        {/* Watchlist button */}
        <button onClick={e=>{e.stopPropagation();onWL(item);}} style={{position:"absolute",top:6,left:6,width:26,height:26,borderRadius:"50%",background:inWL?"rgba(107,140,174,0.9)":"rgba(245,240,232,0.85)",border:"none",color:inWL?"#fff":"rgba(30,37,53,0.5)",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",transition:"all 0.15s"}}>
          {inWL?"★":"☆"}
        </button>
      </div>
      {/* Yellow progress bar (TV Time signature) */}
      {hasProgress&&<div style={{marginBottom:4}}><ProgressBar value={epProgress.watched} max={epProgress.total} color={G.accent} h={3}/></div>}
      <div style={{fontSize:12,fontWeight:500,color:G.text,lineHeight:1.3,marginBottom:2}}>{name}</div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {hasProgress&&<span style={{fontSize:10,color:G.accent,fontWeight:600}}>{pct}%</span>}
        {item.vote_average>0&&<span style={{fontSize:10,color:G.dim}}>★ {item.vote_average.toFixed(1)}</span>}
      </div>
    </div>
  );
}

// ─── EPISODE ROW ─────────────────────────────────────────────────────────────
function EpisodeRow({ep,showId,watched,onToggle,onOpenComments,G}) {
  const key = `ep_show${showId}_ep${ep.id}`;
  const ew = !!watched[key];
  const commentCount = LS.get(SK.C,{})[`show${showId}_ep${ep.id}`]?.length||0;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${G.border}`}}>
      {/* Checkmark — TV Time style */}
      <button onClick={()=>onToggle(ep)} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${ew?G.accent:G.border2}`,background:ew?G.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:ew?"#000":"transparent",fontWeight:700,flexShrink:0,transition:"all 0.15s"}}>✓</button>
      <div style={{flex:1,cursor:"pointer"}} onClick={()=>onOpenComments(ep)}>
        <div style={{fontSize:13,fontWeight:ew?400:500,color:ew?G.muted:G.text}}><span style={{color:G.dim,marginRight:6}}>E{ep.episode_number}</span>{ep.name}</div>
        <div style={{display:"flex",gap:8,marginTop:3}}>
          {ep.air_date&&<span style={{fontSize:11,color:G.dim}}>{ep.air_date}</span>}
          {commentCount>0&&<span style={{fontSize:11,color:G.blue}}>💬 {commentCount}</span>}
        </div>
      </div>
      <button onClick={()=>onOpenComments(ep)} style={{fontSize:11,color:G.dim,padding:"4px 8px",borderRadius:6,border:`1px solid ${G.border}`,background:"transparent",flexShrink:0}}>Discuss</button>
    </div>
  );
}

// ─── EPISODE COMMENTS SHEET ───────────────────────────────────────────────────
function CommentsSheet({showId,ep,user,onClose}) {
  const key = `show${showId}_ep${ep.id}`;
  const [comments,setComments]=useState(()=>LS.get(SK.C,{})[key]||[]);
  const [text,setText]=useState("");
  const [reaction,setReaction]=useState(null);
  const [spoiler,setSpoiler]=useState(false);
  const [revealed,setRevealed]=useState({});

  const save=updated=>{ const all=LS.get(SK.C,{}); all[key]=updated; LS.set(SK.C,all); setComments(updated); };
  const submit=()=>{
    if(!text.trim()&&!reaction)return;
    save([...comments,{id:Date.now(),userId:user.id,userName:user.name,avatar:user.avatar,text:text.trim(),reaction,spoiler,likes:0,likedBy:[],createdAt:Date.now()}]);
    setText(""); setReaction(null); setSpoiler(false);
  };
  const toggleLike=id=>save(comments.map(c=>c.id!==id?c:{...c,likes:c.likedBy.includes(user.id)?c.likes-1:c.likes+1,likedBy:c.likedBy.includes(user.id)?c.likedBy.filter(x=>x!==user.id):[...c.likedBy,user.id]}));

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:G.MAX_W,background:G.surface,borderRadius:"20px 20px 0 0",maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
        {/* Handle */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 20px 0"}}>
          <div style={{width:36,height:4,borderRadius:2,background:G.border2,marginBottom:12}} />
          <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:12,borderBottom:`1px solid ${G.border}`}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:G.text}}>E{ep.episode_number} · {ep.name}</div>
              <div style={{fontSize:11,color:G.muted,marginTop:2}}>{comments.length} comments</div>
            </div>
            <button onClick={onClose} style={{color:G.muted,fontSize:18,padding:4}}>✕</button>
          </div>
        </div>

        {/* Comments list */}
        <div style={{flex:1,overflowY:"auto",padding:"12px 20px"}}>
          {comments.length===0
            ? <Center><div style={{textAlign:"center",color:G.dim,fontSize:13}}>No comments yet.<br/>Be the first to react!</div></Center>
            : [...comments].sort((a,b)=>b.createdAt-a.createdAt).map(c=>{
                const isOwn=c.userId===user.id; const liked=c.likedBy.includes(user.id);
                return (
                  <div key={c.id} style={{display:"flex",gap:10,marginBottom:16}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:G.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#000",flexShrink:0}}>{c.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:600}}>{c.userName}</span>
                        {c.reaction&&<span style={{fontSize:16}}>{c.reaction}</span>}
                        <span style={{fontSize:11,color:G.dim}}>{timeAgo(c.createdAt)}</span>
                        {c.spoiler&&<Pill label="SPOILER" color={G.accent} bg={G.accentDim}/>}
                      </div>
                      {c.text&&(
                        <div style={{position:"relative"}}>
                          <div style={{fontSize:13,color:G.muted,lineHeight:1.5,filter:c.spoiler&&!revealed[c.id]?"blur(6px)":"none",transition:"filter 0.2s"}}>{c.text}</div>
                          {c.spoiler&&!revealed[c.id]&&<button onClick={()=>setRevealed(r=>({...r,[c.id]:true}))} style={{position:"absolute",inset:0,width:"100%",background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:G.accent,fontWeight:600}}>Tap to reveal spoiler</button>}
                        </div>
                      )}
                      <div style={{display:"flex",gap:12,marginTop:6}}>
                        <button onClick={()=>toggleLike(c.id)} style={{fontSize:12,color:liked?G.accent:G.dim,display:"flex",alignItems:"center",gap:4}}>
                          {liked?"♥":"♡"}{c.likes>0&&` ${c.likes}`}
                        </button>
                        {isOwn&&<button onClick={()=>save(comments.filter(x=>x.id!==c.id))} style={{fontSize:12,color:G.dim}}>Delete</button>}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Input */}
        <div style={{padding:"12px 20px",borderTop:`1px solid ${G.border}`,background:G.surface}}>
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
            {REACTIONS.map(r=><button key={r} onClick={()=>setReaction(reaction===r?null:r)} style={{fontSize:20,padding:"4px 6px",borderRadius:8,border:`1px solid ${reaction===r?G.accent:G.border}`,background:reaction===r?G.accentDim:"transparent",transition:"all 0.15s"}}>{r}</button>)}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Add a comment…" rows={2} style={{flex:1,background:G.surface2,border:`1px solid ${G.border}`,borderRadius:10,padding:"8px 12px",color:G.text,fontSize:13,resize:"none",lineHeight:1.5}} />
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
              <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:G.muted,cursor:"pointer"}}>
                <input type="checkbox" checked={spoiler} onChange={e=>setSpoiler(e.target.checked)} style={{accentColor:G.accent,width:12,height:12}} />Spoiler
              </label>
              <button onClick={submit} disabled={!text.trim()&&!reaction} style={{padding:"8px 16px",background:(!text.trim()&&!reaction)?"rgba(255,255,255,0.06)":G.accent,color:(!text.trim()&&!reaction)?G.dim:"#000",borderRadius:8,fontSize:13,fontWeight:600,border:"none",transition:"all 0.15s"}}>Post</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SHOW / MOVIE DETAIL SHEET ────────────────────────────────────────────────
function DetailSheet({item,onClose,watched,setWatched,watchlist,setWatchlist,ratings,setRatings,epTotals,setEpTotals,onFinish,user}) {
  const [detail,setDetail]=useState(null);
  const [seasons,setSeasons]=useState([]);
  const [activeSeason,setActiveSeason]=useState(1);
  const [episodes,setEpisodes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [commentEp,setCommentEp]=useState(null);
  const [ratingHover,setRatingHover]=useState(0);

  const isTV=item.media_type==="tv"; const id=item.id; const name=item.name||item.title;
  const wk=`${item.media_type}_${id}`; const isW=!!watched[wk]; const rating=ratings[wk]||0; const inWL=!!watchlist[wk];
  const watchedEps=Object.keys(watched).filter(k=>k.startsWith(`ep_show${id}_`)).length;
  const totalEps=epTotals[id]||0;

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        if(hasKey()){ const d=await tmdb(`/${isTV?"tv":"movie"}/${id}`); setDetail(d);
          if(isTV&&d.seasons){ const r=d.seasons.filter(s=>s.season_number>0); setSeasons(r); const t=r.reduce((a,s)=>a+s.episode_count,0); if(t>0){const nt={...epTotals,[id]:t};setEpTotals(nt);LS.set(SK.EP,nt);} if(r.length)loadEps(r[0].season_number); }
        } else throw new Error();
      } catch { setDetail(item); if(isTV){setSeasons([{season_number:1,episode_count:8}]);setEpisodes(Array.from({length:8},(_,i)=>({id:i+1,episode_number:i+1,name:`Episode ${i+1}`,air_date:"2024-01-01"})));const nt={...epTotals,[id]:8};setEpTotals(nt);LS.set(SK.EP,nt);} }
      setLoading(false);
    })();
  },[id]);

  const loadEps=async n=>{ setActiveSeason(n); if(!hasKey())return; try{const s=await tmdb(`/tv/${id}/season/${n}`);setEpisodes(s.episodes||[]);}catch{setEpisodes([]);} };
  const toggleW=()=>{ const w={...watched}; if(w[wk])delete w[wk]; else w[wk]={id,type:item.media_type,name,poster_path:item.poster_path,genre_ids:item.genre_ids||[],watchedAt:Date.now()}; setWatched(w);LS.set(SK.W,w); };
  const toggleEp=ep=>{ const k=`ep_show${id}_ep${ep.id}`; const w={...watched}; const was=!!w[k]; if(was)delete w[k]; else w[k]={epId:ep.id,showId:id,watchedAt:Date.now()}; setWatched(w);LS.set(SK.W,w); if(!was){const tot=epTotals[id]||0;const nc=Object.keys(w).filter(x=>x.startsWith(`ep_show${id}_`)).length;if(tot>0&&nc>=tot)onFinish(name);} };
  const setRate=s=>{ const r={...ratings,[wk]:s};setRatings(r);LS.set(SK.R,r); };
  const toggleWL=()=>{ const w={...watchlist}; if(w[wk])delete w[wk]; else w[wk]={id,type:item.media_type,name,poster_path:item.poster_path,addedAt:Date.now(),item}; setWatchlist(w);LS.set(SK.WL,w); };

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)"}} onClick={onClose}>
        <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:G.MAX_W,background:G.bg,borderRadius:"20px 20px 0 0",maxHeight:"92vh",overflowY:"auto",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>

          {/* Backdrop */}
          <div style={{position:"relative",height:220,overflow:"hidden",borderRadius:"20px 20px 0 0"}}>
            {detail?.backdrop_path
              ? <img src={`${TMDB_IMG}/w780${detail.backdrop_path}`} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.5}} />
              : <div style={{width:"100%",height:"100%",background:`linear-gradient(135deg,#E8E0D0,#D4CCBC)`}} />
            }
            <div style={{position:"absolute",inset:0,background:`linear-gradient(to bottom,rgba(0,0,0,0.2),${G.bg})`}} />
            <button onClick={onClose} style={{position:"absolute",top:16,right:16,width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>✕</button>
          </div>

          {loading ? <Center><Spinner/></Center> : (
            <div style={{padding:"0 20px 100px"}}>

              {/* Header row — poster + info */}
              <div style={{display:"flex",gap:16,marginTop:-60,marginBottom:20,position:"relative",zIndex:1}}>
                <div style={{width:90,borderRadius:10,overflow:"hidden",background:"#D8D0C0",aspectRatio:"2/3",flexShrink:0,boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
                  {item.poster_path ? <img src={`${TMDB_IMG}/w200${item.poster_path}`} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📺</div>}
                </div>
                <div style={{flex:1,paddingTop:64}}>
                  <h2 style={{fontSize:20,fontWeight:700,color:G.text,lineHeight:1.2,marginBottom:6}}>{name}</h2>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {(detail?.genres||[]).slice(0,3).map(g=><Pill key={g.id} label={g.name}/>)}
                    {(detail?.vote_average||item.vote_average)>0&&<Pill label={`★ ${(detail?.vote_average||item.vote_average).toFixed(1)}`} color={G.dim} bg="rgba(255,255,255,0.06)"/>}
                  </div>
                </div>
              </div>

              {/* Overview */}
              <p style={{fontSize:13,color:G.muted,lineHeight:1.6,marginBottom:20}}>{detail?.overview||item.overview}</p>

              {/* Episode progress */}
              {isTV&&totalEps>0&&(
                <div style={{marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:12,color:G.muted}}>Progress</span>
                    <span style={{fontSize:12,color:G.accent,fontWeight:600}}>{watchedEps}/{totalEps} episodes</span>
                  </div>
                  <ProgressBar value={watchedEps} max={totalEps} color={G.accent} h={4}/>
                </div>
              )}

              {/* Action buttons */}
              <div style={{display:"flex",gap:10,marginBottom:24}}>
                <button onClick={toggleW} style={{flex:1,padding:"11px 0",background:isW?G.green:G.accent,color:"#000",borderRadius:10,fontSize:14,fontWeight:700,border:"none"}}>
                  {isW?"✓ Watched":"Mark as Watched"}
                </button>
                <button onClick={toggleWL} style={{width:48,height:44,borderRadius:10,border:`1px solid ${inWL?G.accent:G.border2}`,background:inWL?G.accentDim:"transparent",fontSize:20,color:inWL?G.accent:G.muted}}>
                  {inWL?"★":"☆"}
                </button>
              </div>

              {/* Your rating */}
              <div style={{background:G.surface,borderRadius:12,padding:"16px",marginBottom:20}}>
                <div style={{fontSize:11,color:G.muted,fontWeight:600,letterSpacing:"0.08em",marginBottom:10}}>YOUR RATING</div>
                <div style={{display:"flex",gap:4}}>
                  {[1,2,3,4,5].map(i=>(
                    <span key={i} onMouseEnter={()=>setRatingHover(i)} onMouseLeave={()=>setRatingHover(0)} onClick={()=>setRate(i)}
                      style={{fontSize:28,cursor:"pointer",color:(ratingHover||rating)>=i?G.accent:"rgba(255,255,255,0.15)",transition:"color 0.1s,transform 0.1s",transform:ratingHover===i?"scale(1.15)":"scale(1)"}}>★</span>
                  ))}
                  {rating>0&&<span style={{fontSize:13,color:G.accent,alignSelf:"center",marginLeft:6}}>{rating}/5</span>}
                </div>
              </div>

              {/* Episodes */}
              {isTV&&seasons.length>0&&(
                <div>
                  <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
                    {seasons.map(s=>(
                      <button key={s.season_number} onClick={()=>loadEps(s.season_number)}
                        style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:500,border:`1px solid ${activeSeason===s.season_number?G.accent:G.border}`,background:activeSeason===s.season_number?G.accentDim:"transparent",color:activeSeason===s.season_number?G.accent:G.muted,flexShrink:0,transition:"all 0.15s"}}>
                        Season {s.season_number}
                      </button>
                    ))}
                  </div>
                  {episodes.map(ep=><EpisodeRow key={ep.id} ep={ep} showId={id} watched={watched} onToggle={toggleEp} onOpenComments={setCommentEp} G={G}/>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {commentEp&&<CommentsSheet showId={id} ep={commentEp} user={user} onClose={()=>setCommentEp(null)}/>}
    </>
  );
}

// ─── SHOWS TAB ────────────────────────────────────────────────────────────────
function ShowsTab({watched,setWatched,watchlist,setWatchlist,ratings,setRatings,epTotals,setEpTotals,onSelect,onFinish,user}) {
  const [tab,setTab]=useState("watching"); // watching | completed | watchlist
  const watchlistItems=Object.values(watchlist).filter(x=>x.type==="tv");
  const watchedTitles=Object.entries(watched).filter(([k])=>!k.startsWith("ep_")&&watched[k]?.type==="tv").map(([,v])=>v);
  const completedItems=watchedTitles.filter(t=>{ const tot=epTotals[t.id]||0; const wc=Object.keys(watched).filter(k=>k.startsWith(`ep_show${t.id}_`)).length; return tot>0&&wc>=tot; });
  const watchingItems=watchedTitles.filter(t=>{ const tot=epTotals[t.id]||0; const wc=Object.keys(watched).filter(k=>k.startsWith(`ep_show${t.id}_`)).length; return !(tot>0&&wc>=tot); });

  const getEpProg=item=>{ const t=epTotals[item.id]||0; const w=Object.keys(watched).filter(k=>k.startsWith(`ep_show${item.id}_`)).length; return t>0?{watched:w,total:t}:null; };
  const toggleWL=item=>{ const k=`tv_${item.id}`; const w={...watchlist}; if(w[k])delete w[k]; else w[k]={id:item.id,type:"tv",name:item.name,poster_path:item.poster_path,addedAt:Date.now(),item:{...item,media_type:"tv"}}; setWatchlist(w);LS.set(SK.WL,w); };

  const display = tab==="watching"?watchingItems : tab==="completed"?completedItems : watchlistItems.map(x=>({...x,...x.item,id:x.id}));
  const empty = tab==="watching"?"Start tracking shows to see them here." : tab==="completed"?"No completed shows yet." : "Star a show to add it to your watchlist.";

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${G.border}`,marginBottom:16}}>
        {[["watching","Watching"],["watchlist","Watchlist"],["completed","Completed"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"12px 0",fontSize:13,fontWeight:500,borderBottom:`2px solid ${tab===id?G.accent:"transparent"}`,color:tab===id?G.accent:G.muted,transition:"all 0.15s",background:"transparent",border:"none",borderBottom:`2px solid ${tab===id?G.accent:"transparent"}`}}>{label}</button>
        ))}
      </div>
      {display.length===0
        ? <Center py={64}><div style={{textAlign:"center",color:G.dim,fontSize:13}}>{empty}</div></Center>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {display.map(item=>{
              const mediaItem={...item,media_type:"tv"};
              return <PosterCard key={item.id} item={mediaItem} onClick={()=>onSelect(mediaItem)} epProgress={getEpProg(item)} watched={!!watched[`tv_${item.id}`]} inWL={!!watchlist[`tv_${item.id}`]} onWL={()=>toggleWL(item)}/>;
            })}
          </div>
      }
    </div>
  );
}

// ─── MOVIES TAB ───────────────────────────────────────────────────────────────
function MoviesTab({watched,watchlist,setWatchlist,onSelect}) {
  const [tab,setTab]=useState("watched");
  const watchedMovies=Object.entries(watched).filter(([k])=>!k.startsWith("ep_")&&watched[k]?.type==="movie").map(([,v])=>v);
  const wlMovies=Object.values(watchlist).filter(x=>x.type==="movie");
  const display=tab==="watched"?watchedMovies:wlMovies.map(x=>({...x,...x.item,id:x.id}));
  const toggleWL=item=>{ const k=`movie_${item.id}`; const w={...watchlist}; if(w[k])delete w[k]; else w[k]={id:item.id,type:"movie",name:item.title||item.name,poster_path:item.poster_path,addedAt:Date.now(),item:{...item,media_type:"movie"}}; setWatchlist(w);LS.set(SK.WL,w); };

  return (
    <div>
      <div style={{display:"flex",borderBottom:`1px solid ${G.border}`,marginBottom:16}}>
        {[["watched","Watched"],["watchlist","Watchlist"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"12px 0",fontSize:13,fontWeight:500,color:tab===id?G.accent:G.muted,background:"transparent",border:"none",borderBottom:`2px solid ${tab===id?G.accent:"transparent"}`,transition:"all 0.15s"}}>{label}</button>
        ))}
      </div>
      {display.length===0
        ? <Center py={64}><div style={{textAlign:"center",color:G.dim,fontSize:13}}>{tab==="watched"?"No movies logged yet.":"No movies in your watchlist."}</div></Center>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {display.map(item=>{
              const mi={...item,media_type:"movie"};
              return <PosterCard key={item.id} item={mi} onClick={()=>onSelect(mi)} epProgress={null} watched={!!watched[`movie_${item.id}`]} inWL={!!watchlist[`movie_${item.id}`]} onWL={()=>toggleWL(item)}/>;
            })}
          </div>
      }
    </div>
  );
}

// ─── DISCOVER TAB ─────────────────────────────────────────────────────────────
function DiscoverTab({watched,watchlist,setWatchlist,onSelect}) {
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [searching,setSearching]=useState(false);
  const [mediaType,setMediaType]=useState("tv");
  const [genre,setGenre]=useState(null);
  const [browse,setBrowse]=useState([]);
  const [bLoading,setBLoading]=useState(true);
  const [trending,setTrending]=useState([]);

  useEffect(()=>{
    (async()=>{
      try {
        if(hasKey()){
          const [tv,mv]=await Promise.all([tmdb("/trending/tv/week"),tmdb("/trending/movie/week")]);
          setTrending([...tv.results.slice(0,4).map(x=>({...x,media_type:"tv"})),...mv.results.slice(0,4).map(x=>({...x,media_type:"movie"}))]);
        } else throw new Error();
      } catch { setTrending([...MOCK_TV.slice(0,4),...MOCK_MOVIES.slice(0,4)]); }
    })();
  },[]);

  useEffect(()=>{
    if(query)return;
    setBLoading(true);
    (async()=>{
      try {
        if(hasKey()){ const p=genre?{with_genres:genre,sort_by:"popularity.desc"}:{sort_by:"popularity.desc"}; const d=await tmdb(`/discover/${mediaType}`,p); setBrowse(d.results.slice(0,12).map(x=>({...x,media_type:mediaType}))); }
        else throw new Error();
      } catch { setBrowse(mediaType==="tv"?MOCK_TV:MOCK_MOVIES); }
      setBLoading(false);
    })();
  },[mediaType,genre,query]);

  const search=useCallback(async q=>{
    if(!q.trim()){setResults([]);return;}
    setSearching(true);
    try { if(hasKey()){const d=await tmdb("/search/multi",{query:q});setResults(d.results.filter(x=>x.media_type==="tv"||x.media_type==="movie"));}else throw new Error(); }
    catch { setResults([...MOCK_TV,...MOCK_MOVIES].filter(x=>(x.name||x.title).toLowerCase().includes(q.toLowerCase()))); }
    setSearching(false);
  },[]);

  useEffect(()=>{ const t=setTimeout(()=>search(query),350); return()=>clearTimeout(t); },[query,search]);

  const toggleWL=item=>{ const k=`${item.media_type}_${item.id}`; const w={...watchlist}; if(w[k])delete w[k]; else w[k]={id:item.id,type:item.media_type,name:item.name||item.title,poster_path:item.poster_path,addedAt:Date.now(),item}; setWatchlist(w);LS.set(SK.WL,w); };
  const genres=mediaType==="movie"?MOVIE_GENRES:TV_GENRES;
  const display=query?results:(query?[]:[...browse]);

  return (
    <div>
      {/* Search bar */}
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:G.dim,fontSize:16,pointerEvents:"none"}}>⌕</span>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search shows, movies…"
          style={{width:"100%",background:G.surface,border:`1px solid ${G.border}`,borderRadius:12,padding:"11px 14px 11px 42px",color:G.text,fontSize:14,transition:"border 0.2s"}}
          onFocus={e=>e.target.style.borderColor=G.accent} onBlur={e=>e.target.style.borderColor=G.border}/>
      </div>

      {!query&&(
        <>
          {/* Media type toggle */}
          <div style={{display:"flex",background:G.surface,borderRadius:10,padding:3,marginBottom:14,gap:2}}>
            {[["tv","TV Shows"],["movie","Movies"]].map(([t,l])=>(
              <button key={t} onClick={()=>{setMediaType(t);setGenre(null);}} style={{flex:1,padding:"8px 0",borderRadius:8,fontSize:13,fontWeight:500,background:mediaType===t?G.surface2:"transparent",color:mediaType===t?G.text:G.muted,border:"none",transition:"all 0.15s"}}>{l}</button>
            ))}
          </div>
          {/* Genre chips */}
          <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
            {genres.map(g=>(
              <button key={g.id} onClick={()=>setGenre(g.id)}
                style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:500,border:`1px solid ${genre===g.id?G.accent:G.border}`,background:genre===g.id?G.accentDim:"transparent",color:genre===g.id?G.accent:G.muted,flexShrink:0,transition:"all 0.15s"}}>
                {g.name}
              </button>
            ))}
          </div>
          {/* Trending strip */}
          {!query&&trending.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:G.text,marginBottom:12}}>🔥 Trending</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {trending.slice(0,4).map(item=><PosterCard key={`t_${item.media_type}_${item.id}`} item={item} onClick={()=>onSelect(item)} epProgress={null} watched={!!watched[`${item.media_type}_${item.id}`]} inWL={!!watchlist[`${item.media_type}_${item.id}`]} onWL={()=>toggleWL(item)}/>)}
              </div>
            </div>
          )}
          <div style={{fontSize:13,fontWeight:600,color:G.text,marginBottom:12}}>Browse {mediaType==="tv"?"TV Shows":"Movies"}</div>
        </>
      )}

      {(searching||bLoading)&&!query.trim()
        ? null
        : <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {display.map(item=><PosterCard key={`${item.media_type}_${item.id}`} item={item} onClick={()=>onSelect(item)} epProgress={null} watched={!!watched[`${item.media_type}_${item.id}`]} inWL={!!watchlist[`${item.media_type}_${item.id}`]} onWL={()=>toggleWL(item)}/>)}
          </div>
      }
      {(searching||bLoading)&&<Center><Spinner/></Center>}
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
function ProfileTab({user,watched,ratings,watchlist,epTotals,onLogout,onImport}) {
  const titles=Object.entries(watched).filter(([k])=>!k.startsWith("ep_")).map(([,v])=>v).filter(Boolean);
  const epCount=Object.keys(watched).filter(k=>k.startsWith("ep_")).length;
  const tvCount=titles.filter(t=>t.type==="tv").length;
  const mvCount=titles.filter(t=>t.type==="movie").length;
  const rv=Object.values(ratings).filter(Boolean);
  const avg=rv.length?(rv.reduce((a,b)=>a+b,0)/rv.length).toFixed(1):null;
  // Estimate "days watched" — assume avg 45 min/episode
  const daysWatched=((epCount*45)/60/24).toFixed(1);

  const genreCounts={};
  titles.forEach(t=>(t.genre_ids||[]).forEach(gid=>{const n=GENRE_MAP[gid];if(n)genreCounts[n]=(genreCounts[n]||0)+1;}));
  const topGenres=Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const StatBox=({label,value,sub})=>(
    <div style={{background:G.surface,borderRadius:12,padding:"16px 12px",textAlign:"center",flex:1}}>
      <div style={{fontSize:24,fontWeight:700,color:G.accent}}>{value}</div>
      <div style={{fontSize:11,color:G.muted,marginTop:2}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:G.dim,marginTop:1}}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* Profile header */}
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,padding:"20px 0 20px"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:G.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#000",flexShrink:0}}>{user.avatar}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:700,color:G.text}}>{user.name}</div>
          <div style={{fontSize:13,color:G.muted,marginTop:2}}>{user.email}</div>
          <div style={{fontSize:12,color:G.dim,marginTop:4}}>Member since {new Date(user.joinedAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
        </div>
      </div>

      {/* TV Time-style "days watched" hero stat */}
      <div style={{background:`linear-gradient(135deg,${G.accentDim},rgba(107,140,174,0.03))`,border:`1px solid rgba(107,140,174,0.2)`,borderRadius:16,padding:"20px",marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:42,fontWeight:700,color:G.accent,lineHeight:1}}>{daysWatched}</div>
        <div style={{fontSize:14,color:G.muted,marginTop:4}}>days of TV watched</div>
        <div style={{fontSize:11,color:G.dim,marginTop:2}}>{epCount} episodes · {mvCount} movies</div>
      </div>

      {/* Stats grid */}
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <StatBox label="TV Shows" value={tvCount}/>
        <StatBox label="Movies" value={mvCount}/>
        <StatBox label="Avg Rating" value={avg?`${avg}★`:"—"}/>
        <StatBox label="Watchlist" value={Object.keys(watchlist).length}/>
      </div>

      {/* Top genres */}
      {topGenres.length>0&&(
        <div style={{background:G.surface,borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:G.muted,letterSpacing:"0.08em",marginBottom:12}}>TOP GENRES</div>
          {topGenres.map(([g,c])=>(
            <div key={g} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,color:G.text}}>{g}</span>
                <span style={{fontSize:12,color:G.muted}}>{c}</span>
              </div>
              <ProgressBar value={c} max={topGenres[0][1]} color={G.accent} h={3}/>
            </div>
          ))}
        </div>
      )}

      {/* Settings / actions */}
      <div style={{background:G.surface,borderRadius:12,overflow:"hidden",marginBottom:16}}>
        {[
          {label:"📥 Import from TV Time",action:onImport,color:G.accent},
          {label:"↪ Sign out",action:onLogout,color:G.red},
        ].map((item,i)=>(
          <button key={i} onClick={item.action} style={{width:"100%",padding:"15px 16px",textAlign:"left",fontSize:14,color:item.color,background:"transparent",border:"none",borderTop:i>0?`1px solid ${G.border}`:"none",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function Confetti({onDone}) {
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current; if(!canvas)return;
    const ctx=canvas.getContext("2d"); canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const pieces=Array.from({length:120},()=>({x:Math.random()*canvas.width,y:-20-Math.random()*100,w:8+Math.random()*8,h:5+Math.random()*6,color:["#6B8CAE","#5A7A9E","#8AAAC8","#B0C8E0","#D4A96A","#9AB0C8"][Math.floor(Math.random()*6)],vx:(Math.random()-.5)*3,vy:2+Math.random()*3,angle:Math.random()*Math.PI*2,va:(Math.random()-.5)*0.2}));
    let raf,done=false;
    const draw=()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.angle+=p.va;p.vy+=0.04;ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,1-p.y/canvas.height);ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}); if(!done)raf=requestAnimationFrame(draw); };
    draw(); const t=setTimeout(()=>{done=true;cancelAnimationFrame(raf);onDone();},3000);
    return()=>{done=true;cancelAnimationFrame(raf);clearTimeout(t);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:999,pointerEvents:"none"}}/>;
}

// ─── TV TIME IMPORTER ─────────────────────────────────────────────────────────
function Importer({onClose,watched,setWatched,watchlist,setWatchlist}) {
  const [stage,setStage]=useState("idle");
  const [err,setErr]=useState("");
  const [preview,setPreview]=useState(null);
  const [progress,setProgress]=useState(0);
  const fileRef=useRef(null);

  const parseCSV=text=>{ const lines=text.trim().split("\n"); if(lines.length<2)return null; const headers=lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,"").toLowerCase()); const rows=[]; for(let i=1;i<lines.length;i++){const vals=lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)||[];const row={};headers.forEach((h,idx)=>{row[h]=(vals[idx]||"").replace(/^"|"$/g,"").trim();});rows.push(row);} return{headers,rows}; };

  const handleFile=e=>{ const file=e.target.files[0]; if(!file)return; if(!file.name.endsWith(".csv")){setErr("Please upload a .csv file.");setStage("error");return;} setStage("parsing"); const reader=new FileReader(); reader.onload=ev=>{ try{ const p=parseCSV(ev.target.result); if(!p)throw new Error("Empty file"); const h=p.headers; if(!h.includes("show_name")&&!h.includes("name")&&!h.includes("title"))throw new Error("Doesn't look like a TV Time export."); const shows=new Set(),movies=new Set(),eps=[]; p.rows.forEach(r=>{const type=(r.type||r.media_type||"show").toLowerCase();const name=r.show_name||r.series_name||r.name||r.title||"";if(!name)return;if(type.includes("movie")||type.includes("film"))movies.add(name);else{shows.add(name);eps.push(r);};}); setPreview({rows:p.rows,shows:[...shows],movies:[...movies],episodeCount:eps.length,totalRows:p.rows.length});setStage("preview"); }catch(e){setErr(e.message);setStage("error");} }; reader.readAsText(file); };

  const runImport=async()=>{ if(!preview)return; setStage("importing"); const nw={...watched}; let proc=0; const showMap={},movieNames=new Set(); preview.rows.forEach(r=>{const type=(r.type||r.media_type||"show").toLowerCase();const name=r.show_name||r.series_name||r.name||r.title||"";if(!name)return;if(type.includes("movie")||type.includes("film"))movieNames.add(name);else{if(!showMap[name])showMap[name]={episodes:[],name};showMap[name].episodes.push(r);}proc++;setProgress(Math.round((proc/preview.rows.length)*80));}); Object.values(showMap).forEach(show=>{const sid=`tvtime_${show.name.toLowerCase().replace(/\s+/g,"_")}`;const wk=`tv_${sid}`;if(!nw[wk])nw[wk]={id:sid,type:"tv",name:show.name,poster_path:null,genre_ids:[],watchedAt:Date.now(),importedFrom:"tvtime",episodeCount:show.episodes.length};show.episodes.forEach((ep,i)=>{const eid=ep.episode_id||ep.ep_id||i;const ek=`ep_show${sid}_ep${eid}`;if(!nw[ek])nw[ek]={epId:eid,showId:sid,watchedAt:ep.watched_at?new Date(ep.watched_at).getTime():Date.now(),importedFrom:"tvtime"};});}); setProgress(85); movieNames.forEach(name=>{const sid=`tvtime_movie_${name.toLowerCase().replace(/\s+/g,"_")}`;const wk=`movie_${sid}`;if(!nw[wk])nw[wk]={id:sid,type:"movie",name,poster_path:null,genre_ids:[],watchedAt:Date.now(),importedFrom:"tvtime"};}); setProgress(95);setWatched(nw);LS.set(SK.W,nw);setProgress(100);setTimeout(()=>setStage("done"),400); };

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:G.surface,borderRadius:20,width:"100%",maxWidth:440,padding:"28px 24px",animation:"popIn 0.25s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><div style={{fontSize:18,fontWeight:700,color:G.text}}>📥 Import from TV Time</div><div style={{fontSize:12,color:G.muted,marginTop:2}}>Deadline: July 15, 2026</div></div>
          <button onClick={onClose} style={{color:G.muted,fontSize:18}}>✕</button>
        </div>
        <div style={{background:G.accentDim,border:`1px solid rgba(107,140,174,0.3)`,borderRadius:10,padding:"10px 14px",fontSize:12,color:G.accent,marginBottom:20}}>⚠ Export at <strong>gdpr.tvtime.com</strong> then upload <code style={{background:"rgba(0,0,0,0.06)",padding:"1px 5px",borderRadius:4}}>tracking-prod-records-v2.csv</code></div>
        {stage==="idle"&&<div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${G.border}`,borderRadius:12,padding:"32px 16px",textAlign:"center",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=G.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}><div style={{fontSize:32,marginBottom:8}}>📄</div><div style={{fontSize:14,color:G.text,marginBottom:4}}>Drop CSV here or click to browse</div><input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{display:"none"}}/></div>}
        {stage==="parsing"&&<Center><Spinner/></Center>}
        {stage==="preview"&&preview&&(<div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>{[{l:"TV Shows",v:preview.shows.length,c:G.blue},{l:"Movies",v:preview.movies.length,c:G.accent},{l:"Episodes",v:preview.episodeCount.toLocaleString(),c:G.green}].map(s=><div key={s.l} style={{background:G.bg,borderRadius:10,padding:"12px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:G.muted,marginTop:2}}>{s.l}</div></div>)}</div><div style={{display:"flex",gap:10}}><button onClick={()=>{setStage("idle");setPreview(null);}} style={{flex:1,padding:"11px",border:`1px solid ${G.border}`,borderRadius:10,fontSize:13,color:G.muted,background:"transparent"}}>Back</button><button onClick={runImport} style={{flex:2,padding:"11px",background:G.accent,color:"#000",borderRadius:10,fontSize:13,fontWeight:700,border:"none"}}>Import {preview.totalRows.toLocaleString()} records</button></div></div>)}
        {stage==="importing"&&<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:13,color:G.muted,marginBottom:12}}>Importing…</div><div style={{background:"rgba(255,255,255,0.08)",borderRadius:99,height:6,overflow:"hidden",marginBottom:6}}><div style={{width:`${progress}%`,height:"100%",background:G.accent,borderRadius:99,transition:"width 0.3s"}}/></div><div style={{fontSize:12,color:G.dim}}>{progress}%</div></div>}
        {stage==="done"&&<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:48,marginBottom:12}}>✅</div><div style={{fontSize:18,fontWeight:700,color:G.text,marginBottom:8}}>Import complete!</div><button onClick={onClose} style={{padding:"10px 28px",background:G.accent,color:"#000",borderRadius:10,fontSize:13,fontWeight:700,border:"none"}}>Done</button></div>}
        {stage==="error"&&<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:48,marginBottom:12}}>⚠️</div><div style={{fontSize:14,color:G.muted,marginBottom:16}}>{err}</div><button onClick={()=>setStage("idle")} style={{padding:"10px 24px",background:G.accent,color:"#000",borderRadius:10,fontSize:13,fontWeight:700,border:"none"}}>Try again</button></div>}
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({onAuth}) {
  const [mode,setMode]=useState("login");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [gLoading,setGLoading]=useState(false);

  const submit=()=>{ setErr(""); if(!email.trim()||!pw.trim()){setErr("Please fill all fields.");return;} if(mode==="signup"&&!name.trim()){setErr("Please enter your name.");return;} if(pw.length<6){setErr("Password must be 6+ characters.");return;} setLoading(true); setTimeout(()=>{ const r=mode==="signup"?Auth.signup(name.trim(),email.trim().toLowerCase(),pw):Auth.login(email.trim().toLowerCase(),pw); setLoading(false); if(r.error)setErr(r.error); else onAuth(r.user); },700); };
  const handleGoogle=()=>{ setGLoading(true); setTimeout(()=>{ const r=Auth.google(); setGLoading(false); onAuth(r.user); },900); };

  const inputStyle={width:"100%",background:G.surface2,border:`1px solid ${G.border}`,borderRadius:10,padding:"11px 14px",color:G.text,fontSize:14};

  return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-15%",right:"-10%",width:400,height:400,borderRadius:"50%",background:"rgba(107,140,174,0.1)",filter:"blur(80px)"}}/>
        <div style={{position:"absolute",bottom:"-10%",left:"-10%",width:350,height:350,borderRadius:"50%",background:"rgba(107,140,174,0.06)",filter:"blur(60px)"}}/>
      </div>
      <div style={{width:"100%",maxWidth:400,position:"relative",animation:"fadeUp 0.4s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:42,fontWeight:800,color:G.text,letterSpacing:"-0.03em"}}>No<span style={{color:G.accent}}>Spoilers</span></div>
          <div style={{fontSize:13,color:G.muted,marginTop:6}}>Track shows & movies with your community</div>
        </div>
        <div style={{background:G.surface,borderRadius:20,padding:"28px 24px"}}>
          <div style={{display:"flex",background:G.bg,borderRadius:10,padding:3,marginBottom:22,gap:2}}>
            {["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"8px",borderRadius:8,fontSize:13,fontWeight:500,background:mode===m?G.surface:"transparent",color:mode===m?G.text:G.muted,border:"none",transition:"all 0.2s"}}>{m==="login"?"Sign In":"Create Account"}</button>)}
          </div>
          <button onClick={handleGoogle} disabled={gLoading} style={{width:"100%",padding:"11px",borderRadius:10,border:`1px solid ${G.border}`,background:G.surface2,color:G.text,fontSize:13,fontWeight:500,marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:gLoading?0.7:1}}>
            {gLoading?<Spinner size={16}/>:<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
            {gLoading?"Signing in…":"Continue with Google"}
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><div style={{flex:1,height:1,background:G.border}}/><span style={{fontSize:11,color:G.dim}}>OR</span><div style={{flex:1,height:1,background:G.border}}/></div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {mode==="signup"&&<input style={inputStyle} placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>}
            <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <div style={{position:"relative"}}><input style={{...inputStyle,paddingRight:42}} type={showPw?"text":"password"} placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/><button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:16,color:G.dim,padding:2}}>{showPw?"🙈":"👁"}</button></div>
          </div>
          {err&&<div style={{marginTop:12,padding:"9px 12px",background:"rgba(229,57,53,0.1)",border:"1px solid rgba(229,57,53,0.25)",borderRadius:8,fontSize:12,color:G.red}}>{err}</div>}
          <button onClick={submit} disabled={loading} style={{width:"100%",marginTop:18,padding:"12px",background:G.accent,color:"#000",borderRadius:10,fontSize:14,fontWeight:700,border:"none",opacity:loading?0.75:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<><Spinner size={15}/>{mode==="signup"?"Creating…":"Signing in…"}</>:(mode==="signup"?"Create Account":"Sign In")}
          </button>
          <div style={{textAlign:"center",marginTop:14,fontSize:12,color:G.dim}}>
            {mode==="login"?<>No account? <button onClick={()=>{setMode("signup");setErr("");}} style={{color:G.accent,background:"none",border:"none",fontSize:12,fontWeight:500}}>Sign up free</button></> : <>Have an account? <button onClick={()=>{setMode("login");setErr("");}} style={{color:G.accent,background:"none",border:"none",fontSize:12,fontWeight:500}}>Sign in</button></>}
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:16,fontSize:11,color:G.dim}}>Mock auth — no data is sent anywhere</div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const TABS=[{id:"shows",icon:"📺",label:"Shows"},{id:"movies",icon:"🎬",label:"Movies"},{id:"discover",icon:"🔍",label:"Discover"},{id:"profile",icon:"👤",label:"Profile"}];

export default function App() {
  const [tab,setTab]=useState("shows");
  const [user,setUser]=useState(()=>Auth.get());
  const [selected,setSelected]=useState(null);
  const [watched,setWatched]=useState(()=>LS.get(SK.W));
  const [watchlist,setWatchlist]=useState(()=>LS.get(SK.WL));
  const [ratings,setRatings]=useState(()=>LS.get(SK.R));
  const [epTotals,setEpTotals]=useState(()=>LS.get(SK.EP));
  const [confetti,setConfetti]=useState(null);
  const [showImporter,setShowImporter]=useState(false);

  const handleSelect=item=>{ setSelected(item); const r=LS.get(SK.REC,[]); LS.set(SK.REC,[{...item,viewedAt:Date.now()},...r.filter(x=>!(x.id===item.id&&x.media_type===item.media_type))].slice(0,12)); };
  const getEpProg=item=>{ if(item.media_type!=="tv")return null; const t=epTotals[item.id]||0; const w=Object.keys(watched).filter(k=>k.startsWith(`ep_show${item.id}_`)).length; return t>0?{watched:w,total:t}:null; };

  if(!user) return (<><style>{CSS}</style><AuthScreen onAuth={u=>setUser(u)}/></>);

  const sharedProps={watched,setWatched,watchlist,setWatchlist,ratings,setRatings,epTotals,setEpTotals,onSelect:handleSelect,onFinish:n=>{setConfetti(n);},user};

  return (
    <>
      <style>{CSS}</style>
      {confetti&&(
        <>
          <Confetti onDone={()=>setConfetti(null)}/>
          <div style={{position:"fixed",top:"30%",left:"50%",transform:"translateX(-50%)",zIndex:1000,background:G.surface,border:`1px solid ${G.border}`,borderRadius:20,padding:"28px 32px",textAlign:"center",animation:"popIn 0.3s ease",boxShadow:"0 24px 60px rgba(0,0,0,0.6)",minWidth:240}}>
            <div style={{fontSize:52,marginBottom:8}}>🎉</div>
            <div style={{fontSize:20,fontWeight:700,color:G.text,marginBottom:4}}>Show Complete!</div>
            <div style={{fontSize:13,color:G.muted,marginBottom:16}}>{confetti}</div>
            <button onClick={()=>setConfetti(null)} style={{padding:"9px 24px",background:G.accent,color:"#000",borderRadius:9,fontSize:13,fontWeight:700,border:"none"}}>Nice! 🙌</button>
          </div>
        </>
      )}

      {/* Main layout — centered, max width */}
      <div style={{maxWidth:G.MAX_W,margin:"0 auto",minHeight:"100vh",position:"relative",background:G.bg}}>

        {/* Top header */}
        <div style={{position:"sticky",top:0,zIndex:50,background:G.bg,borderBottom:`1px solid ${G.border}`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:22,fontWeight:800,color:G.text,letterSpacing:"-0.02em"}}>No<span style={{color:G.accent}}>Spoilers</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {!hasKey()&&<span style={{fontSize:11,color:G.accent,background:G.accentDim,padding:"3px 8px",borderRadius:20}}>Demo</span>}
            <div style={{width:32,height:32,borderRadius:"50%",background:G.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#000"}}>{user.avatar}</div>
          </div>
        </div>

        {/* Page content */}
        <div style={{padding:"16px 16px 90px"}}>
          {tab==="shows"&&<ShowsTab {...sharedProps}/>}
          {tab==="movies"&&<MoviesTab {...sharedProps}/>}
          {tab==="discover"&&<DiscoverTab watched={watched} watchlist={watchlist} setWatchlist={setWatchlist} onSelect={handleSelect}/>}
          {tab==="profile"&&<ProfileTab user={user} watched={watched} ratings={ratings} watchlist={watchlist} epTotals={epTotals} onLogout={()=>{Auth.logout();setUser(null);}} onImport={()=>setShowImporter(true)}/>}
        </div>

        {/* Bottom tab bar — TV Time style */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:G.MAX_W,background:G.tabBar,borderTop:`1px solid ${G.border}`,display:"flex",zIndex:50}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,border:"none",background:"transparent",color:tab===t.id?G.accent:G.dim,transition:"color 0.15s"}}>
              <span style={{fontSize:22,lineHeight:1}}>{t.icon}</span>
              <span style={{fontSize:10,fontWeight:tab===t.id?600:400}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail sheet */}
      {selected&&<DetailSheet item={selected} onClose={()=>setSelected(null)} watched={watched} setWatched={setWatched} watchlist={watchlist} setWatchlist={setWatchlist} ratings={ratings} setRatings={setRatings} epTotals={epTotals} setEpTotals={setEpTotals} onFinish={n=>setConfetti(n)} user={user}/>}

      {/* Importer */}
      {showImporter&&<Importer onClose={()=>setShowImporter(false)} watched={watched} setWatched={setWatched} watchlist={watchlist} setWatchlist={setWatchlist}/>}
    </>
  );
}
