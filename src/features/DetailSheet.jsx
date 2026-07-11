import { useState, useEffect } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import { tmdb, TMDB_IMG, hasKey } from "../constants/api.js";
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
  const [ratingHover, setRatingHover] = useState(0);

  const isTV = item.media_type === "tv"; const id = item.id; const name = item.name || item.title;
  const wk = `${item.media_type}_${id}`; const isW = !!watched[wk]; const rating = ratings[wk] || 0; const inWL = !!watchlist[wk];
  const watchedEps = Object.keys(watched).filter(k => k.startsWith(`ep_show${id}_`)).length;
  const totalEps = epTotals[id] || 0;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (hasKey()) { const d = await tmdb(`/${isTV ? "tv" : "movie"}/${id}`); setDetail(d);
          if (isTV && d.seasons) { const r = d.seasons.filter(s => s.season_number > 0); setSeasons(r); const t = r.reduce((a,s) => a+s.episode_count, 0); if (t > 0) { const nt = {...epTotals, [id]: t}; setEpTotals(nt); LS.set(SK.EP, nt); } if (r.length) loadEps(r[0].season_number); }
        } else throw new Error();
      } catch { setDetail(item); if (isTV) { setSeasons([{season_number:1, episode_count:8}]); setEpisodes(Array.from({length:8}, (_,i) => ({id:i+1, episode_number:i+1, name:`Episode ${i+1}`, air_date:"2024-01-01"}))); const nt = {...epTotals, [id]:8}; setEpTotals(nt); LS.set(SK.EP, nt); } }
      setLoading(false);
    })();
  }, [id]);

  const loadEps = async n => { setActiveSeason(n); if (!hasKey()) return; try { const s = await tmdb(`/tv/${id}/season/${n}`); setEpisodes(s.episodes || []); } catch { setEpisodes([]); } };
  const toggleW = () => { const w = {...watched}; if (w[wk]) delete w[wk]; else w[wk] = {id, type: item.media_type, name, poster_path: item.poster_path, genre_ids: item.genre_ids || [], watchedAt: Date.now()}; setWatched(w); LS.set(SK.W, w); };
  const toggleEp = ep => { const k = `ep_show${id}_ep${ep.id}`; const w = {...watched}; const was = !!w[k]; if (was) delete w[k]; else w[k] = {epId: ep.id, showId: id, watchedAt: Date.now()}; setWatched(w); LS.set(SK.W, w); if (!was) { const tot = epTotals[id] || 0; const nc = Object.keys(w).filter(x => x.startsWith(`ep_show${id}_`)).length; if (tot > 0 && nc >= tot) onFinish(name); } };
  const setRate = s => { const r = {...ratings, [wk]: s}; setRatings(r); LS.set(SK.R, r); };
  const toggleWL = () => { const w = {...watchlist}; if (w[wk]) delete w[wk]; else w[wk] = {id, type: item.media_type, name, poster_path: item.poster_path, addedAt: Date.now(), item}; setWatchlist(w); LS.set(SK.WL, w); };

  return (
    <>
      <div className="overlay overlay-detail" onClick={onClose}>
        <div className="sheet sheet-detail" onClick={e => e.stopPropagation()}>

          <div style={{position:"relative", height:220, overflow:"hidden", borderRadius:"20px 20px 0 0"}}>
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
                <button onClick={toggleW} style={{flex:1, padding:"11px 0", background: isW ? G.green : G.accent, color:"#000", borderRadius:10, fontSize:14, fontWeight:700, border:"none"}}>
                  {isW ? "✓ Watched" : "Mark as Watched"}
                </button>
                <button onClick={toggleWL} style={{width:48, height:44, borderRadius:10, border:`1px solid ${inWL ? G.accent : G.border2}`, background: inWL ? G.accentDim : "transparent", fontSize:20, color: inWL ? G.accent : G.muted}}>
                  {inWL ? "★" : "☆"}
                </button>
              </div>

              <div style={{background:G.surface, borderRadius:12, padding:"16px", marginBottom:20}}>
                <div className="section-label">YOUR RATING</div>
                <div style={{display:"flex", gap:4}}>
                  {[1,2,3,4,5].map(i => (
                    <span
                      key={i}
                      className={`star${(ratingHover || rating) >= i ? " lit" : ""}`}
                      onMouseEnter={() => setRatingHover(i)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setRate(i)}
                    >★</span>
                  ))}
                  {rating > 0 && <span style={{fontSize:13, color:G.accent, alignSelf:"center", marginLeft:6}}>{rating}/5</span>}
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
                  {episodes.map(ep => <EpisodeRow key={ep.id} ep={ep} showId={id} watched={watched} onToggle={toggleEp} onOpenComments={setCommentEp}/>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {commentEp && <CommentsSheet showId={id} ep={commentEp} user={user} onClose={() => setCommentEp(null)}/>}
    </>
  );
}
