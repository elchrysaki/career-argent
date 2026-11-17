/** Data integrity helpers; private data lives only under .local/ and is gitignored. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const LOCAL=path.join(ROOT,'.local');
export const slug=x=>String(x||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,84);
const tempDefaults={
 'profile.json':{},
 'opportunities.json':{version:1,updatedAt:null,records:[]},
 'contacts.json':[],
 'learning.json':[],
 'progress.json':{stages:{},pinned:[],tasks:[],skills:{}},
 'runs.json':[]
};
export async function ensureLocal(){await fs.mkdir(LOCAL,{recursive:true,mode:0o700});for(const [name,val] of Object.entries(tempDefaults)){try{await fs.access(path.join(LOCAL,name))}catch{await fs.writeFile(path.join(LOCAL,name),JSON.stringify(val,null,2)+'\n',{mode:0o600})}}}
export async function readLocal(name,fallback){if(!Object.hasOwn(tempDefaults,name))throw Error('Local filename not allowed');try{return JSON.parse(await fs.readFile(path.join(LOCAL,name),'utf8'))}catch(e){if(e.code==='ENOENT')return fallback;throw e}}
export async function writeLocal(name,data){if(!Object.hasOwn(tempDefaults,name))throw Error('Local filename not allowed');await fs.mkdir(LOCAL,{recursive:true,mode:0o700});const file=path.join(LOCAL,name),tmp=file+'.tmp';await fs.writeFile(tmp,JSON.stringify(data,null,2)+'\n',{mode:0o600});await fs.rename(tmp,file)}
export function normalizeOpportunity(r,{forceReview=true}={}){
 if(!r||typeof r!=='object'||!r.title||!r.org||!r.url)throw Error('Missing title/organizer/source');
 let uri;try{uri=new URL(r.url)}catch{throw Error('Invalid URL')}
 if(uri.protocol!=='https:')throw Error('Primary source must use HTTPS');
 const str=(x,n=400)=>String(x||'').slice(0,n);
 const url=(x)=>{if(!x)return undefined;try{const u=new URL(x);return u.protocol==='https:'?u.href:undefined}catch{return undefined}};
 const tier=['full','paid','partial','waiver','none','unknown'].includes(r.fundingTier)?r.fundingTier:'unknown';
 const region=['USA','Asia','Europe','Global'].includes(r.region)?r.region:'Global';
 const eligibility=['eligible','conditional','ineligible','unknown'].includes(r.eligibility)?r.eligibility:'unknown';
 const date=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\d$/.test(x)?x:null;
 const num=x=>Math.max(1,Math.min(10,Number(x)||5));
 const ids=Array.isArray(r.contacts)?r.contacts.map(x=>str(x,110)):[];
 return {id:slug(r.id||r.title+' '+r.org),title:str(r.title,190),org:str(r.org,130),country:str(r.country,90),region,category:str(r.category||'Research',70),kind:str(r.kind||'Opportunity',70),deadline:date(r.deadline),openDate:date(r.openDate),fundingTier:tier,funding:str(r.funding||'Not independently verified',500),fundingEvidence:r.fundingEvidence&&typeof r.fundingEvidence==='object'?{stipend:str(r.fundingEvidence.stipend,100),travel:str(r.fundingEvidence.travel,120),housing:str(r.fundingEvidence.housing,120),waiver:str(r.fundingEvidence.waiver,120)}:{},eligibility,verification:forceReview?'review':r.verification==='official'?'official':'review',fit:num(r.fit),output:num(r.output),prestige:num(r.prestige),readiness:num(r.readiness),url:uri.href,fundingSourceUrl:url(r.fundingSourceUrl),eligibilitySourceUrl:url(r.eligibilitySourceUrl),description:str(r.description,1000),nextStep:str(r.nextStep,450),researchOutput:str(r.researchOutput,350),requirements:Array.isArray(r.requirements)?r.requirements.slice(0,20).map(x=>str(x,160)):[],prerequisites:Array.isArray(r.prerequisites)?r.prerequisites.slice(0,15).map(x=>str(x,140)):[],tags:Array.isArray(r.tags)?r.tags.slice(0,20).map(x=>str(x,50)):[],contacts:ids,discoveredAt:date(r.discoveredAt)||new Date().toISOString().slice(0,10),sourceChecked:date(r.sourceChecked)||null,sourceEvidence:str(r.sourceEvidence,650),citizenshipRestriction:str(r.citizenshipRestriction,180),academicYearRestriction:str(r.academicYearRestriction,180)}
}
