/** Public repository allowlist audit: fail closed. The public repo must contain software/templates only. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ALLOWED=new Set([
 '.gitignore','.githooks/pre-commit','.github/workflows/privacy.yml',
 'README.md','CONTRIBUTING.md','SECURITY.md','AGENTS.md','CLAUDE.md','LICENSE',
 'index.html','app.js','server.mjs','styles.css','atelier.css','package.json','assets/mercury-sea.svg',
 'scripts/lib.mjs','scripts/daily.mjs','scripts/setup.mjs','scripts/privacy-check.mjs','scripts/install-hooks.mjs','scripts/install-daily.mjs',
 'templates/profile.template.json','templates/opportunities.template.json','templates/contacts.template.json','templates/progress.template.json','templates/learning.template.json',
 'prompts/daily.md','prompts/review.md','tests/local.test.mjs'
]);
const walk=async(dir)=>{let found=[];for(const x of await fs.readdir(path.join(ROOT,dir),{withFileTypes:true})){let name=path.posix.join(dir,x.name);if(['.git','.local','node_modules','private','data','exports','backups','research-output','coverage'].includes(x.name)&&x.isDirectory())continue;if(x.isDirectory())found.push(...await walk(name));else found.push(name.replace(/^\.\//,''))}return found};
let tracked=[];try{const out=execFileSync('git',['ls-files','--cached','-z'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']});tracked=out.split('\0').filter(Boolean)}catch{}
let unexpected=[];
// Always audit actual public package files. Tracked files additionally checked, even if now ignored.
const src=await walk('.');
for(const file of new Set([...src,...tracked])){
 if(!ALLOWED.has(file))unexpected.push(file);
}
if(unexpected.length){console.error('BLOCKED: non-structural or private-path files detected:\n'+unexpected.sort().join('\n'));process.exitCode=1}
const profile=JSON.parse(await fs.readFile(path.join(ROOT,'templates/profile.template.json'),'utf8'));
for(const k of ['displayName','institution','field','countryOfResidence','citizenship','goals','researchExperience','portfolio'])if(profile[k]!==''&&profile[k]!==undefined)throw Error('Template profile cannot contain user answers: '+k);
for(const k of ['topics','preferredRegions','opportunityKinds','desiredOutputs','skillsToLearn'])if(profile[k]?.length)throw Error('Template must not contain selected preferences: '+k);
const seeds=await fs.readFile(path.join(ROOT,'index.html'),'utf8');
if(/id=["']seed-(?:data|contacts)["']/.test(seeds))throw Error('Inline private seeds forbidden');
const records=JSON.parse(await fs.readFile(path.join(ROOT,'templates/opportunities.template.json'),'utf8'));
if(records.records.length)throw Error('Public opportunity template must be empty');
for(const name of ['.github/workflows/privacy.yml','README.md','app.js','server.mjs','scripts/daily.mjs']){
 const raw=await fs.readFile(path.join(ROOT,name),'utf8');
 if(/(?:sk-proj-[A-Za-z0-9_\-]{16,}|ghp_[A-Za-z0-9]{30,}|sk-ant-[A-Za-z0-9\-_]{16,})/.test(raw))throw Error('Possible secret token in '+name);
}
// Detect accidental copying of unique private profile text into any public source file.
try{
 const privateData=JSON.parse(await fs.readFile(path.join(ROOT,'.local','profile.json'),'utf8'));
 const needles=['displayName','institution','goals','researchExperience','portfolio'].map(k=>privateData[k]).filter(x=>typeof x==='string'&&x.trim().length>=8);
 if(needles.length){
  const publicText=(await Promise.all([...ALLOWED].filter(f=>!/\.svg$/.test(f)).map(async f=>{try{return await fs.readFile(path.join(ROOT,f),'utf8')}catch{return''}}))).join('\n').toLowerCase();
  for(const v of needles)if(publicText.includes(v.trim().toLowerCase())){console.error('BLOCKED: private profile content detected in public source (value withheld).');process.exitCode=1;break}
 }
}catch{}
if(!process.exitCode)console.log('PASS: public allowlist clean; empty templates; no embedded personal dataset. Private files remain ignored and untracked.');
