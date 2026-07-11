import { useState, useEffect, useCallback } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import { tmdb, TMDB_IMG, hasKey } from "../constants/api.js";
import { MOCK_TV, MOCK_MOVIES, TV_GENRES, MOVIE_GENRES } from "../constants/mockData.js";
import Center from "../components/Center.jsx";
import Spinner from "../components/Spinner.jsx";
import PosterCard from "../components/PosterCard.jsx";

export default function DiscoverTab({watched,watchlist,setWatchlist,onSelect}) {
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
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:G.dim,fontSize:16,pointerEvents:"none"}}>⌕</span>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search shows, movies…"
          style={{width:"100%",background:G.surface,border:`1px solid ${G.border}`,borderRadius:12,padding:"11px 14px 11px 42px",color:G.text,fontSize:14,transition:"border 0.2s"}}
          onFocus={e=>e.target.style.borderColor=G.accent} onBlur={e=>e.target.style.borderColor=G.border}/>
      </div>

      {!query&&(
        <>
          <div style={{display:"flex",background:G.surface,borderRadius:10,padding:3,marginBottom:14,gap:2}}>
            {[["tv","TV Shows"],["movie","Movies"]].map(([t,l])=>(
              <button key={t} onClick={()=>{setMediaType(t);setGenre(null);}} style={{flex:1,padding:"8px 0",borderRadius:8,fontSize:13,fontWeight:500,background:mediaType===t?G.surface2:"transparent",color:mediaType===t?G.text:G.muted,border:"none",transition:"all 0.15s"}}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
            {genres.map(g=>(
              <button key={g.id} onClick={()=>setGenre(g.id)}
                style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:500,border:`1px solid ${genre===g.id?G.accent:G.border}`,background:genre===g.id?G.accentDim:"transparent",color:genre===g.id?G.accent:G.muted,flexShrink:0,transition:"all 0.15s"}}>
                {g.name}
              </button>
            ))}
          </div>
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
