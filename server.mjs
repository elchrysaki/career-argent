/** ARGENT is a loopback-only, dependency-free local web server. */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { ensureLocal, readLocal, writeLocal, normalizeOpportunity, slug } from './scripts/lib.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.ARGENT_PORT||4178);
const ORIGINS=new Set([`http://127.0.0.1:${PORT}`,`http://localhost:${PORT}`]);
const allowed=new Map([
['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/styles.css','styles.css'],['/atelier.css','atelier.css'],['/assets/mercury-sea.svg','assets/mercury-sea.svg']
]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const respond=(res,status,payload)=>{let raw=JSON.stringify(payload);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(raw)};
const fileJson=async(name,fallback)=>readLocal(name,fallback);
const defaults={profile:{},opportunities:{version:1,records:[]},contacts:[],learning:[],progress:{stages:{},pinned:[],tasks:[],skills:{}},runs:[]};
const state=async()=>{const r={};for(const [k,v] of Object.entries(defaults))r[k]=await fileJson(k+'.json',v);return r};
async function body(req){let chunks=[],count=0;for await (const c of req){count+=c.length;if(count>1024*1024)throw Error('Payload exceeds 1 MB');chunks.push(c)}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
async function handle(req,res){
 const requestedHost=String(req.headers.host||'').toLowerCase();if(![`127.0.0.1:${PORT}`,`localhost:${PORT}`].includes(requestedHost)){res.writeHead(403);return res.end('Localhost only')}
 const reqUrl=new URL(req.url,`http://127.0.0.1:${PORT}`);const name=reqUrl.pathname;
 if(name.startsWith('/api/')){
  if(req.headers['x-argent-local']!=='1')return respond(res,403,{error:'Local API header required'});
  if(req.method!=='GET'&&(!ORIGINS.has(req.headers.origin)||!String(req.headers['content-type']).startsWith('application/json')))return respond(res,403,{error:'Same-origin JSON requests only'});
  try{
   if(req.method==='GET'&&name==='/api/state')return respond(res,200,await state());
   if(req.method==='GET'&&name==='/api/export')return respond(res,200,await state());
   if(req.method==='GET'&&name==='/api/health')return respond(res,200,{ok:true,mode:'local',port:PORT});
   if(req.method==='POST'&&name==='/api/profile'){
    const p=await body(req);if(!p||Array.isArray(p)||typeof p!=='object')throw Error('Expected profile JSON object');
    const clean={};const allowedKeys=['version','displayName','institution','field','degreeLevel','studyYear','graduationYear','countryOfResidence','citizenship','timezone','goals','researchExperience','portfolio','topics','preferredRegions','opportunityKinds','desiredOutputs','skillsToLearn','fundingUSAsia','fundingEurope','provider','dailyLimit','dailyTime','allowDetailedProfileToAgent'];
    for(const k of allowedKeys)if(Object.hasOwn(p,k))clean[k]=p[k];
    clean.dailyLimit=Math.max(1,Math.min(10,Number(clean.dailyLimit)||10));
    await writeLocal('profile.json',clean);return respond(res,200,{ok:true});
   }
   if(req.method==='POST'&&name==='/api/progress'){
    const p=await body(req);if(!p||typeof p!=='object')throw Error('Expected progress object');
    const clean={stages:p.stages&&typeof p.stages==='object'?p.stages:{},pinned:Array.isArray(p.pinned)?p.pinned:[],tasks:Array.isArray(p.tasks)?p.tasks:[],skills:p.skills&&typeof p.skills==='object'?p.skills:{}};
    await writeLocal('progress.json',clean);return respond(res,200,{ok:true});
   }
   if(req.method==='POST'&&name==='/api/restore'){
    const backup=await body(req);
    if(!backup||typeof backup!=='object'||!backup.opportunities||!Array.isArray(backup.opportunities.records)||!backup.profile||typeof backup.profile!=='object'||!backup.progress||typeof backup.progress!=='object')throw Error('Not an ARGENT private backup');
    if(backup.opportunities.records.length>15000)throw Error('Backup is too large');
    // Only trusted user-chosen backups preserve manually verified status.
    const cleanRecords=backup.opportunities.records.map(x=>normalizeOpportunity(x,{forceReview:false}));
    const names=['profile','opportunities','contacts','learning','progress','runs'];
    const restored={profile:backup.profile,opportunities:{version:1,updatedAt:new Date().toISOString(),records:cleanRecords},contacts:Array.isArray(backup.contacts)?backup.contacts.slice(0,20000):[],learning:Array.isArray(backup.learning)?backup.learning.slice(0,20000):[],progress:backup.progress,runs:Array.isArray(backup.runs)?backup.runs.slice(0,200):[]};
    for(const n of names)await writeLocal(n+'.json',restored[n]);
    return respond(res,200,{ok:true,records:cleanRecords.length});
   }
   if(req.method==='POST'&&name==='/api/import'){
    const importBody=await body(req);const raw=Array.isArray(importBody)?importBody:importBody.records;
    if(!Array.isArray(raw))throw Error('Expected records array');
    const existing=await fileJson('opportunities.json',defaults.opportunities);
    const keys=new Set(existing.records.map(r=>r.id));const joint=new Set(existing.records.map(r=>slug(r.title+' '+r.org)));
    let added=0,duplicates=0,rejected=0;
    for(const item of raw.slice(0,1000)){
      try{const opp=normalizeOpportunity(item,{forceReview:true});if(keys.has(opp.id)||joint.has(slug(opp.title+' '+opp.org))){duplicates++;continue}keys.add(opp.id);joint.add(slug(opp.title+' '+opp.org));existing.records.push(opp);added++}catch{rejected++}
    }
    existing.updatedAt=new Date().toISOString();await writeLocal('opportunities.json',existing);return respond(res,200,{added,duplicates,rejected});
   }
   return respond(res,404,{error:'Unknown local API endpoint'});
  }catch(e){return respond(res,400,{error:e.message})}
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
 const rel=allowed.get(name);if(!rel){res.writeHead(404);return res.end('Not found')}
 try{const content=await fs.readFile(path.join(ROOT,rel));res.writeHead(200,{'Content-Type':types[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Opener-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"});res.end(req.method==='HEAD'?'':content)}catch{res.writeHead(404);res.end('Not found')}
}
await ensureLocal();
http.createServer((req,res)=>{handle(req,res).catch(err=>respond(res,500,{error:'Local server error'}))}).listen(PORT,'127.0.0.1',()=>console.log(`ARGENT (private/local): http://127.0.0.1:${PORT}\nPrivate files: ${path.join(ROOT,'.local')}\nNo public hosting or cloud sync enabled.`));
