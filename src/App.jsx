import { useState, useEffect, lazy, Suspense } from "react";
import { G } from "./constants/tokens.js";
import { TABS } from "./constants/tabs.js";
import { LS, SK } from "./constants/storage.js";
import { hasKey } from "./constants/api.js";
import { Auth } from "./auth/Auth.js";
import { fetchProfile, loadUserData, migrateLocalStorage } from "./lib/db.js";
import { supabase } from "./lib/supabase.js";
import ShowsTab from "./features/ShowsTab.jsx";
import MoviesTab from "./features/MoviesTab.jsx";
import DiscoverTab from "./features/DiscoverTab.jsx";
import ProfileTab from "./features/ProfileTab.jsx";
import Confetti from "./features/Confetti.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Center from "./components/Center.jsx";
import Spinner from "./components/Spinner.jsx";

const DetailSheet        = lazy(() => import("./features/DetailSheet.jsx"));
const Importer           = lazy(() => import("./features/Importer.jsx"));
const AuthScreen         = lazy(() => import("./features/AuthScreen.jsx"));
const ResetPasswordScreen = lazy(() => import("./features/ResetPasswordScreen.jsx"));
const SocialTab          = lazy(() => import("./features/SocialTab.jsx"));
const PublicProfileSheet = lazy(() => import("./features/PublicProfileSheet.jsx"));

export default function App() {
  const [tab,setTab]=useState("shows");
  const [authLoading,setAuthLoading]=useState(true);
  const [user,setUser]=useState(null);
  const [selected,setSelected]=useState(null);
  const [watched,setWatched]=useState({});
  const [watchlist,setWatchlist]=useState({});
  const [ratings,setRatings]=useState({});
  const [epTotals,setEpTotals]=useState({});
  const [confetti,setConfetti]=useState(null);
  const [showImporter,setShowImporter]=useState(false);
  const [viewedProfile,setViewedProfile]=useState(null);
  const [resettingPassword,setResettingPassword]=useState(false);

  useEffect(() => {
    const { data: { subscription } } = Auth.onAuthChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      if (event === "PASSWORD_RECOVERY") { setResettingPassword(true); setAuthLoading(false); return; }
      if (event === "USER_UPDATED") setResettingPassword(false);
      if (session?.user) {
        await migrateLocalStorage(session.user.id);
        let profile = await fetchProfile(session.user.id);
        if (!profile) {
          await supabase.from("profiles").insert({ id: session.user.id, name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User", avatar: session.user.user_metadata?.avatar || "🎬" });
          profile = await fetchProfile(session.user.id);
        }
        const data = await loadUserData(session.user.id);
        setWatched(data.watched); setWatchlist(data.watchlist); setRatings(data.ratings); setEpTotals(data.epTotals);
        setUser(profile);
      } else {
        setUser(null); setWatched({}); setWatchlist({}); setRatings({}); setEpTotals({});
      }
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSelect=item=>{ setSelected(item); const r=LS.get(SK.REC,[]); LS.set(SK.REC,[{...item,viewedAt:Date.now()},...r.filter(x=>!(x.id===item.id&&x.media_type===item.media_type))].slice(0,12)); };

  if (authLoading) return <Center py={200}><Spinner/></Center>;

  if (resettingPassword) return (
    <Suspense fallback={<Center py={200}><Spinner/></Center>}>
      <ResetPasswordScreen/>
    </Suspense>
  );

  if(!user) return (
    <Suspense fallback={<Center py={200}><Spinner/></Center>}>
      <AuthScreen/>
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
            <div style={{width:32,height:32,borderRadius:"50%",background:G.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#000"}}>{user.avatar}</div>
          </div>
        </div>

        <div style={{padding:"16px 16px 90px"}}>
          <ErrorBoundary>
            {tab==="shows"&&<ShowsTab {...sharedProps}/>}
            {tab==="movies"&&<MoviesTab {...sharedProps}/>}
            {tab==="discover"&&<DiscoverTab watched={watched} watchlist={watchlist} setWatchlist={setWatchlist} onSelect={handleSelect} user={user}/>}
            {tab==="friends"&&(
              <Suspense fallback={<Center py={200}><Spinner/></Center>}>
                <SocialTab user={user} watched={watched} onViewProfile={setViewedProfile}/>
              </Suspense>
            )}
            {tab==="profile"&&<ProfileTab user={user} watched={watched} ratings={ratings} watchlist={watchlist} epTotals={epTotals} onLogout={()=>Auth.logout()} onImport={()=>setShowImporter(true)} onProfileUpdate={u=>setUser(prev=>({...prev,...u}))} onNavigate={setTab}/>}
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
          <Importer onClose={()=>setShowImporter(false)} watched={watched} setWatched={setWatched} watchlist={watchlist} setWatchlist={setWatchlist} epTotals={epTotals} setEpTotals={setEpTotals} user={user}/>
        </Suspense>
      )}
      {viewedProfile&&(
        <Suspense fallback={null}>
          <PublicProfileSheet profile={viewedProfile} currentUser={user} onClose={()=>setViewedProfile(null)}/>
        </Suspense>
      )}
    </>
  );
}
