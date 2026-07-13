import { useState, useEffect, useRef, useCallback } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import { tmdb, TMDB_IMG, hasKey } from "../constants/api.js";
import { useWatchlistToggle } from "../hooks/useWatchlistToggle.js";
import { upsertWatchedItem, deleteWatchedItem, upsertWatchedEpisode, deleteWatchedEpisode, upsertRating, deleteRating, upsertEpTotal } from "../lib/db.js";
import Center from "../components/Center.jsx";
import Spinner from "../components/Spinner.jsx";
import Pill from "../components/Pill.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import EpisodeRow from "../components/EpisodeRow.jsx";
import CommentsSheet from "./CommentsSheet.jsx";

export default function DetailSheet({item, onClose, watched, setWatched, watchlist, setWatchlist, ratings, setRatings, epTotals, setEpTotals, onFinish, user}) {
  const [detail, setDetail] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentEp, setCommentEp] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});
  const [ratingHover, setRatingHover] = useState(0);
  const loadAbortRef = useRef(null);
  const watchedRef = useRef(watched);
  watchedRef.current = watched;
  const epTotalsRef = useRef(epTotals);
  epTotalsRef.current = epTotals;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const isTV = item.media_type === "tv"; const id = item.id; const tmdbId = item.tmdbId || item.id; const name = item.name || item.title;
  const wk = `${item.media_type}_${id}`; const isW = !!watched[wk]; const rating = ratings[wk] || 0; const inWL = !!watchlist[wk];
  const rawWatchedEps = Object.keys(watched).filter(k => k.startsWith(`ep_show${id}_`)).length;
  const totalEps = epTotals[id] || 0;
  const watchedEps = totalEps > 0 ? Math.min(rawWatchedEps, totalEps) : rawWatchedEps;

  const toggleWL = useWatchlistToggle(watchlist, setWatchlist, user.id);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      try {
        if (hasKey()) {
          const d = await tmdb(`/${isTV ? "tv" : "movie"}/${tmdbId}`, {}, ac.signal);
          if (cancelled) return;
          setDetail(d);
          if (isTV && d.seasons) {
            const r = d.seasons.filter(s => s.season_number > 0);
            setSeasons(r);
            const t = r.reduce((a,s) => a+s.episode_count, 0);
            if (t > 0) { const nt = {...epTotals, [id]: t}; setEpTotals(nt); upsertEpTotal(id, t); }
            if (r.length) loadEps(r[0].season_number);
          }
        } else throw new Error();
      } catch {
        if (cancelled) return;
        setDetail(item);
        if (isTV) {
          const total = item.number_of_episodes || 8;
          setSeasons([{season_number:1, episode_count:total}]);
          setEpisodes(Array.from({length:total}, (_,i) => ({id:i+1, episode_number:i+1, name:`Episode ${i+1}`, air_date:"2024-01-01"})));
          const nt = {...epTotals, [id]:total}; setEpTotals(nt); upsertEpTotal(id, total);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; ac.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEps = async n => {
    setActiveSeason(n);
    if (!hasKey()) return;
    if (loadAbortRef.current) loadAbortRef.current.abort();
    loadAbortRef.current = new AbortController();
    try {
      const s = await tmdb(`/tv/${tmdbId}/season/${n}`, {}, loadAbortRef.current.signal);
      setEpisodes(s.episodes || []);
    } catch { setEpisodes([]); }
  };

  const toggleW = () => {
    const w = {...watched};
    if (w[wk]) {
      delete w[wk];
      Object.keys(w).filter(k => k.startsWith(`ep_show${id}_`)).forEach(k => { delete w[k]; deleteWatchedEpisode(user.id, k); });
      setWatched(w); deleteWatchedItem(user.id, wk);
      if (ratings[wk]) { const r = {...ratings}; delete r[wk]; setRatings(r); deleteRating(user.id, wk); }
    }
    else { const entry = {id, type: item.media_type, name, poster_path: item.poster_path, genre_ids: item.genre_ids || [], vote_average: detail?.vote_average || item.vote_average || 0, watchedAt: Date.now(), runtime: detail?.runtime || 0}; w[wk] = entry; setWatched(w); upsertWatchedItem(user.id, wk, entry); }
  };

  const toggleEp = useCallback(ep => {
    const newK = `ep_show${id}_s${ep.season_number}e${ep.episode_number}`; const oldK = `ep_show${id}_ep${ep.id}`;
    const was = !!(watchedRef.current[newK] || watchedRef.current[oldK]);
    if (was) {
      deleteWatchedEpisode(user.id, newK); deleteWatchedEpisode(user.id, oldK);
      setWatched(prev => { const w = {...prev}; delete w[newK]; delete w[oldK]; return w; });
    } else {
      const entry = {epId: ep.id, showId: id, watchedAt: Date.now(), runtime: ep.runtime || 0};
      upsertWatchedEpisode(user.id, newK, entry);
      setWatched(prev => {
        const w = {...prev, [newK]: entry};
        const tot = epTotalsRef.current[id] || 0;
        const nc = Object.keys(w).filter(x => x.startsWith(`ep_show${id}_`)).length;
        if (tot > 0 && nc >= tot) setTimeout(() => onFinishRef.current(name), 0);
        return w;
      });
    }
  }, [id, user.id, name]);

  const setRate = s => { const r = {...ratings, [wk]: s}; setRatings(r); upsertRating(user.id, wk, s); };
  const handleCloseComments = (updatedComments) => {
    if (commentEp) {
      const key = isTV ? `show${id}_ep${commentEp.id}` : `movie${id}`;
      setCommentCounts(prev => ({...prev, [key]: updatedComments || []}));
    }
    setCommentEp(null);
  };

  return (
    <>
      <div className="overlay overlay-detail" onClick={onClose}>
        <div className="sheet sheet-detail" onClick={e => e.stopPropagation()}>

          <div style={{position:"relative", height:220, overflow:"hidden"}}>
            {detail?.backdrop_path
              ? <img src={`${TMDB_IMG}/w780${detail.backdrop_path}`} alt="" style={{width:"100%", height:"100%", objectFit:"cover", opacity:0.5}}/>
              : <div style={{width:"100%", height:"100%", background:"linear-gradient(135deg,#E8E0D0,#D4CCBC)"}}/>
            }
            <div style={{position:"absolute", inset:0, background:`linear-gradient(to bottom,rgba(0,0,0,0.2),${G.bg})`}}/>
            <button onClick={onClose} style={{position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.6)", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)"}}>✕</button>
          </div>

          {loading ? <Center><Spinner/></Center> : (
            <div style={{padding:"0 20px 100px"}}>
              <div style={{display:"flex", gap:16, marginTop:-60, marginBottom:20, position:"relative", zIndex:1}}>
                <div style={{width:90, borderRadius:10, overflow:"hidden", background:"#D8D0C0", aspectRatio:"2/3", flexShrink:0, boxShadow:"0 8px 24px rgba(0,0,0,0.15)"}}>
                  {item.poster_path ? <img src={`${TMDB_IMG}/w200${item.poster_path}`} alt={name} style={{width:"100%", height:"100%", objectFit:"cover"}}/> : <div style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24}}>📺</div>}
                </div>
                <div style={{flex:1, paddingTop:64}}>
                  <h2 style={{fontSize:20, fontWeight:700, color:G.text, lineHeight:1.2, marginBottom:6}}>{name}</h2>
                  <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:8}}>
                    {(detail?.genres || []).slice(0,3).map(g => <Pill key={g.id} label={g.name}/>)}
                    {(detail?.vote_average || item.vote_average) > 0 && <Pill label={`★ ${(detail?.vote_average || item.vote_average).toFixed(1)}`} color={G.dim} bg="rgba(255,255,255,0.06)"/>}
                  </div>
                </div>
              </div>

              <p style={{fontSize:13, color:G.muted, lineHeight:1.6, marginBottom:20}}>{detail?.overview || item.overview}</p>

              {isTV && totalEps > 0 && (
                <div style={{marginBottom:20}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
                    <span style={{fontSize:12, color:G.muted}}>Progress</span>
                    <span style={{fontSize:12, color:G.accent, fontWeight:600}}>{watchedEps}/{totalEps} episodes</span>
                  </div>
                  <ProgressBar value={watchedEps} max={totalEps} h={4}/>
                </div>
              )}

              <div style={{display:"flex", gap:10, marginBottom:24}}>
                <button onClick={toggleW} style={{flex:1, padding:"11px 0", minHeight:44, background: isW ? G.success : G.accent, color:"#000", borderRadius:10, fontSize:14, fontWeight:700, border:"none"}}>
                  {isW ? "✓ Watched" : "Mark as Watched"}
                </button>
                <button onClick={() => toggleWL(item)} style={{minWidth:48, height:44, borderRadius:10, border:`1px solid ${inWL ? G.accent : G.border2}`, background: inWL ? G.accentDim : "transparent", fontSize:20, color: inWL ? G.accent : G.muted}}>
                  {inWL
                    ? <svg width="13" height="16" viewBox="0 0 12 15" fill="currentColor"><path d="M0 0h12v15l-6-3.5L0 15z"/></svg>
                    : <svg width="13" height="16" viewBox="0 0 12 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M1 1h10v13l-5-3-5 3z"/></svg>
                  }
                </button>
                {!isTV && (
                  <button onClick={() => setCommentEp({id: null, name: detail?.title || name, episode_number: null})} style={{minWidth:48, height:44, borderRadius:10, border:`1px solid ${G.border2}`, background:"transparent", color: commentCounts[`movie${id}`]?.length > 0 ? G.accent : G.muted, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:1, padding:"0 8px"}}>
                    💬
                    {commentCounts[`movie${id}`]?.length > 0 && <span style={{fontSize:9, fontWeight:600, lineHeight:1}}>{commentCounts[`movie${id}`].length}</span>}
                  </button>
                )}
              </div>

              <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap", rowGap:8}}>
                <span style={{fontSize:11, fontWeight:600, color:G.dim, letterSpacing:"0.06em", flexShrink:0}}>YOUR RATING</span>
                <div style={{display:"flex", gap:4, alignItems:"center"}}>
                  {[1,2,3,4,5].map(i => (
                    <span
                      key={i}
                      className={`star${(ratingHover || rating) >= i ? " lit" : ""}`}
                      onMouseEnter={() => setRatingHover(i)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setRate(i)}
                    >{(ratingHover || rating) >= i ? "★" : "☆"}</span>
                  ))}
                  {rating > 0 && <span style={{fontSize:13, color:G.accent, marginLeft:6}}>{rating}/5</span>}
                </div>
              </div>

              {isTV && seasons.length > 0 && (
                <div>
                  <div style={{display:"flex", gap:4, marginBottom:16, overflowX:"auto", paddingBottom:4}}>
                    {seasons.map(s => (
                      <button key={s.season_number} onClick={() => loadEps(s.season_number)} className={`season-chip${activeSeason === s.season_number ? " active" : ""}`}>
                        Season {s.season_number}
                      </button>
                    ))}
                  </div>
                  {episodes.map(ep => {
                    const nk = `ep_show${id}_s${ep.season_number}e${ep.episode_number}`;
                    const ok = `ep_show${id}_ep${ep.id}`;
                    return <EpisodeRow key={ep.id} ep={ep} isWatched={!!(watched[nk] || watched[ok])} onToggle={toggleEp} onOpenComments={setCommentEp} commentCount={commentCounts[`show${id}_ep${ep.id}`]?.length || 0}/>;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {commentEp && <CommentsSheet showId={id} ep={commentEp} user={user} onClose={handleCloseComments}/>}
    </>
  );
}
