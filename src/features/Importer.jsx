import { useState, useRef } from "react";
import { G } from "../constants/tokens.js";
import { LS, SK } from "../constants/storage.js";
import Center from "../components/Center.jsx";
import Spinner from "../components/Spinner.jsx";

export default function Importer({onClose,watched,setWatched,watchlist,setWatchlist}) {
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
