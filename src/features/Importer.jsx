import { useState, useRef } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import { tmdb, hasKey } from "../constants/api.js";
import { bulkImport, watchedToRows, watchlistToRows } from "../lib/db.js";
import Center from "../components/Center.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Importer({onClose, watched, setWatched, watchlist, setWatchlist, epTotals, setEpTotals, user}) {
  const [stage, setStage] = useState("idle");
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const fileRef = useRef(null);

  const splitLine = s => { const r=[]; let cur='', q=false; for(const c of s){if(c==='"'){q=!q}else if(c===','&&!q){r.push(cur);cur=''}else{cur+=c}} r.push(cur); return r; };
  const parseCSV = text => { const lines = text.trim().split("\n"); if (lines.length < 2) return null; const headers = splitLine(lines[0]).map(h => h.trim().replace(/^"|"$/g,"").toLowerCase()); const rows = []; for (let i = 1; i < lines.length; i++) { const vals = splitLine(lines[i]); const row = {}; headers.forEach((h,idx) => { row[h] = (vals[idx] || "").replace(/^"|"$/g,"").trim(); }); rows.push(row); } return {headers, rows}; };

  const parseFile = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = ev => { try { const p = parseCSV(ev.target.result); if (!p) throw new Error(`${file.name}: empty file`); const h = p.headers; if (!h.includes("show_name") && !h.includes("series_name") && !h.includes("movie_name") && !h.includes("entity_type") && !h.includes("name") && !h.includes("title")) throw new Error(`${file.name}: doesn't look like a TV Time export`); if (h.includes("entity_type")) { resolve({ watchedRows: p.rows.filter(r => r.type === "watch" && r.entity_type === "movie"), watchlistRows: p.rows.filter(r => r.type === "follow" && r.entity_type === "movie") }); } else { const episodeRows = p.rows.filter(r => r.ep_id); const watchedShowNames = new Set(episodeRows.map(r => r.series_name).filter(Boolean)); const tvWlRows = p.rows.filter(r => !r.ep_id && r.series_name && !watchedShowNames.has(r.series_name)); resolve({ watchedRows: episodeRows, watchlistRows: tvWlRows }); } } catch(e) { reject(e); } }; reader.readAsText(file); });

  const handleFile = e => { const files = [...e.target.files]; if (!files.length) return; const bad = files.find(f => !f.name.endsWith(".csv")); if (bad) { setErr(`${bad.name} is not a .csv file.`); setStage("error"); return; } setStage("parsing"); Promise.all(files.map(parseFile)).then(results => { const combined = results.flatMap(r => r.watchedRows); const allWlRows = results.flatMap(r => r.watchlistRows); const watchedMovieNames = new Set(combined.map(r => r.movie_name).filter(Boolean)); const wlRows = allWlRows.filter(r => !watchedMovieNames.has(r.movie_name)); const shows = new Set(), movies = new Set(), eps = []; combined.forEach(r => { const name = r.show_name || r.series_name || r.name || r.title || r.movie_name || ""; const type = (r.entity_type || r.media_type || (r.movie_name && !r.series_name ? "movie" : "show")).toLowerCase(); if (!name) return; if (type.includes("movie") || type.includes("film")) movies.add(name); else { shows.add(name); eps.push(r); } }); const wlMovieNames = new Set(wlRows.map(r => r.movie_name).filter(Boolean)); const wlShowNames = new Set(wlRows.filter(r => r.series_name && !r.movie_name).map(r => r.series_name)); setPreview({rows: combined, watchlistRows: wlRows, shows: [...shows], movies: [...movies], episodeCount: eps.length, totalRows: shows.size + movies.size + eps.length + wlMovieNames.size + wlShowNames.size, watchlistCount: wlMovieNames.size + wlShowNames.size}); setStage("preview"); }).catch(e => { setErr(e.message); setStage("error"); }); };

  const enrichImported = async (nw, nwl = {}, userId) => {
    const cache = LS.get(SK.EC, {});
    const applyToNwl = (entry, e) => ({ ...entry, poster_path: e.poster_path, tmdbId: e.tmdbId, vote_average: e.vote_average || 0, item: { ...entry.item, poster_path: e.poster_path, genre_ids: e.genre_ids || [], tmdbId: e.tmdbId, vote_average: e.vote_average || 0 } });
    const newEpTotals = {...epTotals};
    Object.entries(nw).forEach(([, v]) => { if (v.type === "tv" && v.importedFrom === "tvtime" && !newEpTotals[v.id]) { const ck = `tv:${v.name}`; if (cache[ck]?.episodeCount > 0) newEpTotals[v.id] = cache[ck].episodeCount; } });
    setEpTotals({...newEpTotals});
    const allEntries = new Map();
    Object.entries(nw).forEach(([wk, v]) => { if (v.importedFrom === "tvtime" && !v.poster_path) allEntries.set(`${v.type}:${v.name}`, {wk, entry: v}); });
    Object.entries(nwl).forEach(([wk, v]) => { const ck = `${v.type}:${v.name}`; if (v.importedFrom === "tvtime" && !v.poster_path && !allEntries.has(ck)) allEntries.set(ck, {wk, entry: v}); });
    allEntries.forEach(({wk, entry}) => { const ck = `${entry.type}:${entry.name}`; if (cache[ck]) { const e = cache[ck]; if (nw[wk]) nw[wk] = {...nw[wk], ...e}; if (nwl[wk]) nwl[wk] = applyToNwl(nwl[wk], e); } });
    setWatched({...nw}); setWatchlist({...nwl});
    const uncached = [...allEntries.entries()].filter(([ck]) => !cache[ck]);
    if (!hasKey()) return;
    const BATCH = 10;
    const numBatches = Math.ceil(uncached.length / BATCH);
    for (let i = 0; i < uncached.length; i += BATCH) {
      await Promise.all(uncached.slice(i, i + BATCH).map(async ([ck, {wk, entry}]) => {
        try {
          const yearMatch = entry.name.match(/\s*\((\d{4})\)\s*$/);
          const cleanName = yearMatch ? entry.name.slice(0, yearMatch.index).trim() : entry.name;
          const ep = entry.type === "movie" ? "/search/movie" : "/search/tv";
          const d = await tmdb(ep, yearMatch ? {query: cleanName, [entry.type === "movie" ? "primary_release_year" : "first_air_date_year"]: yearMatch[1]} : {query: cleanName});
          const hit = d.results?.[0] ?? (yearMatch ? (await tmdb(ep, {query: cleanName})).results?.[0] : null);
          if (hit) { const enriched = {poster_path: hit.poster_path, genre_ids: hit.genre_ids || [], vote_average: hit.vote_average || 0, tmdbId: hit.id}; if (entry.type === "tv") { try { const det = await tmdb(`/tv/${hit.id}`); if (det.number_of_episodes > 0) { enriched.episodeCount = det.number_of_episodes; newEpTotals[entry.id] = det.number_of_episodes; } } catch {} } if (nw[wk]) nw[wk] = {...nw[wk], ...enriched}; if (nwl[wk]) nwl[wk] = applyToNwl(nwl[wk], enriched); cache[ck] = {...enriched, ts: Date.now()}; }
        } catch { /* keep entry as-is */ }
      }));
      setWatched({...nw}); setWatchlist({...nwl});
      LS.set(SK.EC, cache); setEpTotals({...newEpTotals});
      setProgress(30 + Math.round(((i / BATCH + 1) / numBatches) * 60));
      const { watchedItems, watchedEpisodes } = watchedToRows(nw);
      await bulkImport(userId, { watchedItems, watchedEpisodes, watchlistItems: watchlistToRows(nwl), epTotals: newEpTotals });
    }
  };

  const runImport = async () => { if (!preview) return; setStage("importing"); const nw = {...watched}; if (preview.rows.some(r => r.ep_id)) { Object.keys(nw).forEach(k => { if (k.startsWith("ep_show") && nw[k].importedFrom === "tvtime") delete nw[k]; }); } let proc = 0; const showMap = {}, movieNames = new Set(); preview.rows.forEach(r => { const name = r.show_name || r.series_name || r.name || r.title || r.movie_name || ""; const type = (r.entity_type || r.media_type || (r.movie_name && !r.series_name ? "movie" : "show")).toLowerCase(); if (!name) return; if (type.includes("movie") || type.includes("film")) movieNames.add(name); else { if (!showMap[name]) showMap[name] = {episodes:[], name}; showMap[name].episodes.push(r); } proc++; setProgress(Math.round((proc/preview.rows.length)*10)); }); Object.values(showMap).forEach(show => { const sid = `tvtime_${show.name.toLowerCase().replace(/\s+/g,"_")}`; const wk = `tv_${sid}`; if (!nw[wk]) nw[wk] = {id:sid, type:"tv", name:show.name, poster_path:null, genre_ids:[], watchedAt:Date.now(), importedFrom:"tvtime", episodeCount:show.episodes.length}; show.episodes.forEach((ep,i) => { const eid = ep.episode_id || ep.ep_id || i; const sn = parseInt(ep.season_number); const en = parseInt(ep.episode_number); const ek = (!isNaN(sn) && !isNaN(en)) ? `ep_show${sid}_s${sn}e${en}` : `ep_show${sid}_ep${eid}`; if (!nw[ek]) nw[ek] = {epId:eid, showId:sid, watchedAt:ep.watched_at?new Date(ep.watched_at).getTime():ep.created_at?new Date(ep.created_at).getTime():Date.now(), importedFrom:"tvtime"}; }); }); setProgress(10); movieNames.forEach(name => { const sid = `tvtime_movie_${name.toLowerCase().replace(/\s+/g,"_")}`; const wk = `movie_${sid}`; if (!nw[wk]) nw[wk] = {id:sid, type:"movie", name, poster_path:null, genre_ids:[], watchedAt:Date.now(), importedFrom:"tvtime"}; }); const nwl = {...watchlist}; const wlMovieNames = new Set(preview.watchlistRows.map(r => r.movie_name).filter(Boolean)); wlMovieNames.forEach(name => { const sid = `tvtime_movie_${name.toLowerCase().replace(/\s+/g,"_")}`; const wk = `movie_${sid}`; if (!nwl[wk]) nwl[wk] = {id:sid, type:"movie", name, poster_path:null, addedAt:Date.now(), item:{id:sid, type:"movie", media_type:"movie", name, poster_path:null, genre_ids:[]}, importedFrom:"tvtime"}; }); const wlShowNames = new Set(preview.watchlistRows.filter(r => r.series_name && !r.movie_name).map(r => r.series_name).filter(Boolean)); wlShowNames.forEach(name => { const sid = `tvtime_${name.toLowerCase().replace(/\s+/g,"_")}`; const wk = `tv_${sid}`; if (!nwl[wk]) nwl[wk] = {id:sid, type:"tv", name, poster_path:null, addedAt:Date.now(), item:{id:sid, type:"tv", media_type:"tv", name, poster_path:null, genre_ids:[]}, importedFrom:"tvtime"}; }); setProgress(15); setWatched(nw); setWatchlist(nwl);
    const importedEpTotals = {};
    Object.values(showMap).forEach(show => { const sid = `tvtime_${show.name.toLowerCase().replace(/\s+/g,"_")}`; importedEpTotals[sid] = show.episodes.length; });
    setEpTotals(prev => ({...prev, ...importedEpTotals}));
    const { watchedItems, watchedEpisodes } = watchedToRows(nw);
    await bulkImport(user.id, { watchedItems, watchedEpisodes, watchlistItems: watchlistToRows(nwl), epTotals: importedEpTotals });
    setProgress(30);
    setStatusMsg(preview.shows.length > 0 ? "Importing your TV shows…" : "Importing your movies…");
    await enrichImported(nw, nwl, user.id);
    setProgress(100); setStage("done"); };

  return (
    <div className="overlay overlay-importer" onClick={onClose}>
      <div style={{background:G.surface, borderRadius:20, width:"100%", maxWidth:440, padding:"28px 24px", animation:"popIn 0.25s ease"}} onClick={e => e.stopPropagation()}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
          <div>
            <div style={{fontSize:18, fontWeight:700, color:G.text}}>📥 Import from TV Time</div>
          </div>
          <button onClick={onClose} style={{color:G.muted, fontSize:18}}>✕</button>
        </div>
        <div style={{background:G.accentDim, border:`1px solid rgba(107,140,174,0.3)`, borderRadius:10, padding:"10px 14px", fontSize:12, color:G.accent, marginBottom:20}}>
          ⚠ Export at <strong>gdpr.tvtime.com</strong> — import each file separately. Use <code style={{background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:4}}>tracking-prod-records-v2.csv</code> for TV episodes and <code style={{background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:4}}>tracking-prod-records.csv</code> for movies.
          <br/><span style={{color:"rgba(107,140,174,0.6)"}}>Imports may take a few minutes — please keep this window open.</span>
        </div>

        {stage === "idle" && (
          <div className="drop-zone" onClick={() => fileRef.current?.click()}>
            <div style={{fontSize:32, marginBottom:8}}>📄</div>
            <div style={{fontSize:14, color:G.text, marginBottom:4}}>Drop a CSV here or click to browse</div>
            <div style={{fontSize:12, color:G.muted}}>Import one file at a time</div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{display:"none"}}/>
          </div>
        )}
        {stage === "parsing" && <Center><Spinner/></Center>}
        {stage === "preview" && preview && (
          <div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16}}>
              {[{l:"TV Shows",v:preview.shows.length,c:G.blue},{l:"Movies",v:preview.movies.length,c:G.accent},{l:"Episodes",v:preview.episodeCount.toLocaleString(),c:G.success},{l:"Watchlist",v:preview.watchlistCount,c:G.dim}].map(s => (
                <div key={s.l} style={{background:G.bg, borderRadius:10, padding:"12px", textAlign:"center"}}>
                  <div style={{fontSize:22, fontWeight:700, color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11, color:G.muted, marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex", gap:10}}>
              <button onClick={() => { setStage("idle"); setPreview(null); }} style={{flex:1, padding:"11px", border:`1px solid ${G.border}`, borderRadius:10, fontSize:13, color:G.muted, background:"transparent"}}>Back</button>
              <button onClick={runImport} style={{flex:2, padding:"11px", background:G.accent, color:"#000", borderRadius:10, fontSize:13, fontWeight:700, border:"none"}}>Import {preview.totalRows.toLocaleString()} records</button>
            </div>
          </div>
        )}
        {stage === "importing" && (
          <div style={{textAlign:"center", padding:"16px 0"}}>
            <div style={{fontSize:13, color:G.muted, marginBottom:12}}>{statusMsg || "Importing…"}</div>
            <div style={{background:"rgba(255,255,255,0.08)", borderRadius:99, height:6, overflow:"hidden", marginBottom:6}}>
              <div style={{width:`${progress}%`, height:"100%", background:G.accent, borderRadius:99, transition:"width 0.3s"}}/>
            </div>
            <div style={{fontSize:12, color:G.dim}}>{progress}%</div>
          </div>
        )}
        {stage === "done" && (
          <div style={{textAlign:"center", padding:"16px 0"}}>
            <div style={{fontSize:48, marginBottom:12}}>✅</div>
            <div style={{fontSize:18, fontWeight:700, color:G.text, marginBottom:8}}>Import complete!</div>
            <button onClick={onClose} style={{padding:"10px 28px", background:G.accent, color:"#000", borderRadius:10, fontSize:13, fontWeight:700, border:"none"}}>Done</button>
          </div>
        )}
        {stage === "error" && (
          <div style={{textAlign:"center", padding:"16px 0"}}>
            <div style={{fontSize:48, marginBottom:12}}>⚠️</div>
            <div style={{fontSize:14, color:G.muted, marginBottom:16}}>{err}</div>
            <button onClick={() => setStage("idle")} style={{padding:"10px 24px", background:G.accent, color:"#000", borderRadius:10, fontSize:13, fontWeight:700, border:"none"}}>Try again</button>
          </div>
        )}
      </div>
    </div>
  );
}
