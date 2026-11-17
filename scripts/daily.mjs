/** Run a personal opportunity scan with the user's own installed Claude or Codex CLI.
 * Important: this contacts the selected AI provider, but NEVER publishes to GitHub.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ensureLocal,readLocal,writeLocal,normalizeOpportunity,slug,LOCAL,ROOT} from './lib.mjs';

const args=process.argv.slice(2);
const getArg=k=>{const hit=args.find(s=>s.startsWith('--'+k+'='));return hit?hit.slice(k.length+3):null};
if(args.includes('--help')){console.log('Usage: node scripts/daily.mjs [--provider=codex|claude] [--dry-run] [--input=/absolute/path/to/JSON]\nCLI authentication and web research are configured by the user. No Git commits are made.');process.exit(0)}
await ensureLocal();
const profile=await readLocal('profile.json',{});
const db=await readLocal('opportunities.json',{version:1,records:[]});
const contacts=await readLocal('contacts.json',[]);
const learning=await readLocal('learning.json',[]);
const runs=await readLocal('runs.json',[]);
const provider=getArg('provider')||profile.provider||'codex';
if(!['codex','claude'].includes(provider))throw Error('Choose --provider=codex or --provider=claude');
const asOf=new Date().toISOString().slice(0,10);
const limit=Math.min(10,Math.max(1,Number(profile.dailyLimit)||10));
const redacted={degreeLevel:profile.degreeLevel||'unspecified',field:profile.field||'',studyYear:profile.studyYear||'',graduationYear:profile.graduationYear||'',countryOfResidence:profile.countryOfResidence||'',citizenship:profile.citizenship||'',topics:profile.topics||[],preferredRegions:profile.preferredRegions||[],opportunityKinds:profile.opportunityKinds||[],desiredOutputs:profile.desiredOutputs||[],skillsToLearn:profile.skillsToLearn||[],fundingUSAsia:profile.fundingUSAsia||'preferred',fundingEurope:profile.fundingEurope||'preferred'};
if(profile.allowDetailedProfileToAgent){redacted.institution=profile.institution||'';redacted.goals=profile.goals||'';redacted.researchExperience=profile.researchExperience||'';redacted.portfolio=profile.portfolio||''}
const instructions=await fs.readFile(path.join(ROOT,'prompts','daily.md'),'utf8');
const known=profile.allowDetailedProfileToAgent?db.records.map(r=>`${r.title} | ${r.org} | ${r.url}`).slice(0,500):[]; // local dedup is always enforced without disclosing choices
const prompt=instructions.replaceAll('{{TODAY}}',asOf).replaceAll('{{LIMIT}}',String(limit)).replace('{{PROFILE}}',JSON.stringify(redacted,null,2)).replace('{{EXISTING}}',known.join('\n')||'(saved selections withheld; deduplicate locally after research)');
const promptFile=path.join(LOCAL,'last-prompt.txt');
await fs.writeFile(promptFile,prompt,{mode:0o600});
if(args.includes('--dry-run')){console.log(`Review the locally generated, private prompt:\n${promptFile}\nNo AI call or data updates were made.`);process.exit(0)}
function parseCandidate(text){
 const s=text.trim();try{return JSON.parse(s)}catch{}
 const start=s.indexOf('{'),end=s.lastIndexOf('}');if(start>=0&&end>start){try{return JSON.parse(s.slice(start,end+1))}catch{}}
 throw Error('No parseable JSON response. Review .local/last-agent-output.txt and ask agent to retry with strict JSON.');
}
async function callCLI(){
 let bin,cmdArgs;
 if(provider==='codex'){
  bin='codex';cmdArgs=['exec','--skip-git-repo-check','--sandbox','read-only','--output-last-message',path.join(LOCAL,'agent-final.txt'),prompt];
 }else{
  bin='claude';cmdArgs=['-p','--output-format','text','--allowedTools','WebSearch','WebFetch',prompt];
 }
 console.log(`Running ${provider} research. This sends the redacted local profile and search prompt to your configured AI provider. It DOES NOT publish to GitHub.`);
 return await new Promise((resolve,reject)=>{
  const cp=spawn(bin,cmdArgs,{cwd:ROOT,env:{...process.env,CI:'1'},stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';
  const cap=(target,chunk)=>{let v=chunk.toString();if(target==='out')stdout+=v;else stderr+=v;const MAX=8*1024*1024;if(stdout.length>MAX||stderr.length>MAX){cp.kill('SIGTERM')}};
  cp.stdout.on('data',data=>cap('out',data));cp.stderr.on('data',data=>cap('err',data));
  cp.on('error',e=>reject(new Error(`Cannot launch ${bin}. Install and sign in to its CLI first. ${e.message}`)));
  cp.on('close',async code=>{
   try{
    if(provider==='codex'){
     try{stdout=await fs.readFile(path.join(LOCAL,'agent-final.txt'),'utf8')}catch{}
    }
    await fs.writeFile(path.join(LOCAL,'last-agent-output.txt'),stdout,{mode:0o600});
    if(code!==0)return reject(new Error(`${bin} exited with ${code}. Its web access or CLI authentication may be unavailable. ${stderr.slice(-300)}`));
    resolve(stdout);
   }catch(e){reject(e)}
  });
 });
}
let response;
try{
 const input=getArg('input');
 if(input){const file=path.resolve(input);if(!file.startsWith(LOCAL+path.sep))throw Error('--input must point to a file inside .local/');response=await fs.readFile(file,'utf8')}
 else response=await callCLI();
 const output=parseCandidate(response);
 if(!output||typeof output!=='object'||!Array.isArray(output.records))throw Error('Expected {records:[],contacts:[]}');
 const keys=new Set(db.records.map(x=>x.id));const names=new Set(db.records.map(x=>slug(x.title+' '+x.org)));
 const today=new Date().toISOString().slice(0,10);
 let added=0,duplicates=0,rejected=0;
 const newIds=new Set();
 for(const candidate of output.records.slice(0,limit)){
  try{
   const rec=normalizeOpportunity(candidate,{forceReview:true});
   if(keys.has(rec.id)||names.has(slug(rec.title+' '+rec.org))){duplicates++;continue}
   if(rec.deadline&&rec.deadline<today){rejected++;continue}
   if((rec.region==='USA'||rec.region==='Asia')&&profile.fundingUSAsia==='required'){
    if(!['full','paid','partial'].includes(rec.fundingTier)||!rec.fundingSourceUrl){rejected++;continue}
   }
   if(rec.region==='Europe'&&profile.fundingEurope==='required'&&!['full','paid','partial'].includes(rec.fundingTier)){rejected++;continue}
   if(rec.eligibility==='ineligible'){rejected++;continue}
   if(!rec.eligibilitySourceUrl){rejected++;continue}
   keys.add(rec.id);names.add(slug(rec.title+' '+rec.org));newIds.add(rec.id);db.records.push(rec);added++;
  }catch{rejected++}
 }
 const knownContactIds=new Set(contacts.map(c=>c.id));let people=0;
 const contactCounts={};
 // Only attach public profiles the agent associates with an actually accepted opportunity.
 for(const c of (Array.isArray(output.contacts)?output.contacts:[]).slice(0,4*limit)){
  try{
   if(!c.name||!c.url||!c.opportunityId)continue;
   let loc=new URL(c.url);if(loc.protocol!=='https:')continue;
   const opportunityId=slug(c.opportunityId);
   if(!newIds.has(opportunityId))continue;
   if((contactCounts[opportunityId]||0)>=4)continue;
   const id=slug(c.name+' '+c.institution);
   const rec=db.records.find(x=>x.id===opportunityId);
   if(!rec)continue;
   if(!knownContactIds.has(id)){
    contacts.push({id,name:String(c.name).slice(0,120),role:String(c.role||'Research contact').slice(0,140),institution:String(c.institution||rec.org).slice(0,120),focus:String(c.focus||'').slice(0,240),url:loc.href,outreach:String(c.outreach||'Study their work before contacting.').slice(0,300),restriction:String(c.restriction||'Research match only; no availability implied').slice(0,240),verification:'review',sourceChecked:today});knownContactIds.add(id);people++;
   }
   if(!rec.contacts.includes(id)){rec.contacts.push(id);contactCounts[opportunityId]=(contactCounts[opportunityId]||0)+1;}
  }catch{}
 }
 let gapsAdded=0;
 const existingGaps=new Set(learning.map(g=>slug(g.skill)));
 for(const gap of (Array.isArray(output.learningGaps)?output.learningGaps:[]).slice(0,20)){
  if(!gap||!gap.skill||!gap.why||!Array.isArray(gap.steps))continue;
  let k=slug(gap.skill);if(existingGaps.has(k))continue;
  existingGaps.add(k);learning.push({id:k,skill:String(gap.skill).slice(0,120),why:String(gap.why).slice(0,480),steps:gap.steps.slice(0,8).map(x=>String(x).slice(0,190)),relatedOpportunityIds:Array.isArray(gap.relatedOpportunityIds)?gap.relatedOpportunityIds.map(slug).filter(id=>db.records.some(r=>r.id===id)).slice(0,15):[],sourceUrl:typeof gap.sourceUrl==='string'&&gap.sourceUrl.startsWith('https://')?gap.sourceUrl:null,discoveredAt:today,status:'suggested'});gapsAdded++
 }
 const run={date:today,time:new Date().toISOString(),provider,added,duplicates,rejected,contactsAdded:people,note:'AI findings require independent human review before applying.'};
 runs.unshift(run);await writeLocal('opportunities.json',{...db,updatedAt:new Date().toISOString()});await writeLocal('contacts.json',contacts);await writeLocal('learning.json',learning);await writeLocal('runs.json',runs.slice(0,100));
 console.log(`Done: ${added} new review-pending leads, ${duplicates} duplicates, ${rejected} excluded, ${people} public contact profiles, ${gapsAdded} learning gaps. All stored privately in .local/. No commits.`);
}catch(e){runs.unshift({date:asOf,time:new Date().toISOString(),provider,added:0,error:e.message});await writeLocal('runs.json',runs.slice(0,100));console.error('Scan failed:',e.message);process.exitCode=1}
