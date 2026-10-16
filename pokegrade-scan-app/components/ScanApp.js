"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const ENDPOINT="/api/scan-card";
async function compress(file){
  const img=await createImageBitmap(file); const max=1600; const scale=Math.min(1,max/Math.max(img.width,img.height));
  const canvas=document.createElement("canvas"); canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
  canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height); img.close();
  const blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",0.82));
  if(!blob) throw new Error("Image processing failed."); return new File([blob],"card.jpg",{type:"image/jpeg"});
}
function useUrl(file){const u=useMemo(()=>file?URL.createObjectURL(file):null,[file]);useEffect(()=>()=>u&&URL.revokeObjectURL(u),[u]);return u;}
export default function ScanApp(){
 const [front,setFront]=useState(null),[back,setBack]=useState(null),[status,setStatus]=useState("idle"),[result,setResult]=useState(null),[error,setError]=useState(""); const abort=useRef();
 const fu=useUrl(front),bu=useUrl(back);
 useEffect(()=>{if(front&&back&&status==="idle") scan(front,back)},[front,back]);
 async function pick(side,file){if(!file)return;try{setError("");setResult(null);setStatus("idle");const out=await compress(file);side==="front"?setFront(out):setBack(out)}catch(e){setError(e.message)}}
 async function scan(f=front,b=back){if(!f||!b)return;setStatus("scanning");setError("");abort.current=new AbortController();try{const form=new FormData();form.append("front",f);form.append("back",b);const r=await fetch(ENDPOINT,{method:"POST",body:form,signal:abort.current.signal});const j=await r.json();if(!r.ok)throw new Error(j.error||"Scan failed.");setResult(j);setStatus("success")}catch(e){if(e.name!=="AbortError"){setError(e.message);setStatus("error")}else setStatus("idle")}}
 function reset(){abort.current?.abort();setFront(null);setBack(null);setResult(null);setError("");setStatus("idle")}
 return <main><header><b>PokéGrade</b><button onClick={reset}>New scan</button></header><section className="hero"><small>NO TYPING REQUIRED</small><h1>Scan your Pokémon card</h1><p>Photograph the front and back. The app identifies it, checks current pricing, and gives a visual grade estimate.</p></section><div className="grid"><section className="panel"><h2>1. Capture both sides</h2><div className="photos"><Capture label="Front" url={fu} onFile={f=>pick("front",f)}/><Capture label="Back" url={bu} onFile={f=>pick("back",f)}/></div><p className="tip">Remove sleeves, avoid glare, keep all four corners visible, and use a plain dark background.</p></section><section className="panel"><h2>2. Result</h2>{status==="idle"&&!error&&<State text="Waiting for both photos"/>}{status==="scanning"&&<State text="Identifying card and retrieving prices…" spin/>}{status==="error"&&<State text={error} error action={()=>scan()}/>} {status==="success"&&<Results data={result}/>} {error&&status==="idle"&&<State text={error} error/>}</section></div></main>
}
function Capture({label,url,onFile}){return <label className="capture">{url?<img src={url} alt={label}/>:<div><b>Scan {label.toLowerCase()}</b><span>Camera or photo library</span></div>}<input type="file" accept="image/*" capture="environment" onChange={e=>onFile(e.target.files?.[0])}/></label>}
function State({text,spin,error,action}){return <div className={`state ${error?"bad":""}`}><div className={spin?"spinner":"icon"}>{error?"!":"◉"}</div><b>{text}</b>{action&&<button onClick={action}>Retry scan</button>}</div>}
function Results({data}){const c=data.card,p=data.prices||{},g=data.estimatedGrade;const vals=[["Raw market",p.rawMarket],["PSA 8",p.psa8],["PSA 9",p.psa9],["PSA 10",p.psa10]].filter(x=>Number.isFinite(x[1]));return <div className="results"><div className="identified">{c.imageUrl&&<img src={c.imageUrl} alt={c.name}/>}<div><small>IDENTIFIED · {Math.round((c.confidence||0)*100)}% MATCH</small><h2>{c.name}</h2><p>{c.setName}</p><p>#{c.number} · {c.rarity||"Rarity unavailable"}</p></div></div><div className="box"><b>Current pricing</b><div className="metrics">{vals.map(([l,v])=><Metric key={l} l={l} v={new Intl.NumberFormat("en-US",{style:"currency",currency:p.currency||"USD"}).format(v)}/>)}</div><small>Source: {p.source} · Updated: {p.updatedAt}</small></div>{g&&<div className="box yellow"><b>AI estimated grade</b><strong>{g.overall}</strong><div className="metrics"><Metric l="Centering" v={g.centering}/><Metric l="Corners" v={g.corners}/><Metric l="Edges" v={g.edges}/><Metric l="Surface" v={g.surface}/></div></div>}<p className="tip">Image-based estimate only, not an official PSA, BGS, or CGC grade. Prices are reference values.</p></div>}
function Metric({l,v}){return <div className="metric"><small>{l}</small><b>{v??"N/A"}</b></div>}
