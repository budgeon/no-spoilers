import { useState, lazy, Suspense } from "react";
import { G } from "./constants/tokens.js";
import { TABS } from "./constants/tabs.js";
import { LS, SK } from "./constants/storage.js";
import { hasKey } from "./constants/api.js";
import { Auth } from "./auth/Auth.js";
import ShowsTab from "./features/ShowsTab.jsx";
import MoviesTab from "./features/MoviesTab.jsx";
import DiscoverTab from "./features/DiscoverTab.jsx";
import ProfileTab from "./features/ProfileTab.jsx";
import Confetti from "./features/Confetti.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Center from "./components/Center.jsx";
import Spinner from "./components/Spinner.jsx";

const DetailSheet = lazy(() => import("./features/DetailSheet.jsx"));
const Importer    = lazy(() => import("./features/Importer.jsx"));
const AuthScreen  = lazy(() => import("./features/AuthScreen.jsx"));

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

  if(!user) return (
    <Suspense fallback={<Center py={200}><Spinner/></Center>}>
      <AuthScreen onAuth={u=>setUser(u)}/>
    </Suspense>
  );

  const sharedProps={watched,setWatched,watchlist,setWatchlist,ratings,setRatings,epTotals,setEpTotals,onSelect:handleSelect,onFinish:n=>{setConfetti(n);},user};

  return (
    <>
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

      <div style={{maxWidth:G.MAX_W,margin:"0 auto",minHeight:"100vh",position:"relative",background:G.bg}}>
        <div style={{position:"sticky",top:0,zIndex:50,background:G.bg,borderBottom:`1px solid ${G.border}`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:22,fontWeight:800,color:G.text,letterSpacing:"-0.02em"}}>No<span style={{color:G.accent}}>Spoilers</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {!hasKey()&&<span style={{fontSize:11,color:G.accent,background:G.accentDim,padding:"3px 8px",borderRadius:20}}>Demo</span>}
            <div style={{width:32,height:32,borderRadius:"50%",background:G.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#000"}}>{user.avatar}</div>
          </div>
        </div>

        <div style={{padding:"16px 16px 90px"}}>
          <ErrorBoundary>
            {tab==="shows"&&<ShowsTab {...sharedProps}/>}
            {tab==="movies"&&<MoviesTab {...sharedProps}/>}
            {tab==="discover"&&<DiscoverTab watched={watched} watchlist={watchlist} setWatchlist={setWatchlist} onSelect={handleSelect}/>}
            {tab==="profile"&&<ProfileTab user={user} watched={watched} ratings={ratings} watchlist={watchlist} epTotals={epTotals} onLogout={()=>{Auth.logout();setUser(null);}} onImport={()=>setShowImporter(true)}/>}
          </ErrorBoundary>
        </div>

        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:G.MAX_W,background:G.tabBar,borderTop:`1px solid ${G.border}`,display:"flex",zIndex:50}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,border:"none",background:"transparent",color:tab===t.id?G.accent:G.dim,transition:"color 0.15s"}}>
              <span style={{fontSize:22,lineHeight:1}}>{t.icon}</span>
              <span style={{fontSize:10,fontWeight:tab===t.id?600:400}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selected&&(
        <Suspense fallback={<Center py={200}><Spinner/></Center>}>
          <ErrorBoundary>
            <DetailSheet item={selected} onClose={()=>setSelected(null)} watched={watched} setWatched={setWatched} watchlist={watchlist} setWatchlist={setWatchlist} ratings={ratings} setRatings={setRatings} epTotals={epTotals} setEpTotals={setEpTotals} onFinish={n=>setConfetti(n)} user={user}/>
          </ErrorBoundary>
        </Suspense>
      )}
      {showImporter&&(
        <Suspense fallback={null}>
          <Importer onClose={()=>setShowImporter(false)} watched={watched} setWatched={setWatched} watchlist={watchlist} setWatchlist={setWatchlist}/>
        </Suspense>
      )}
    </>
  );
}
