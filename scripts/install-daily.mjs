/** macOS launchd installer; runs the selected local CLI at 08:30 every morning. Explicit opt-in only. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {ensureLocal,readLocal,LOCAL} from './lib.mjs';
const platform=process.platform;
if(platform!=='darwin'){console.error('This helper supports macOS. See README for Linux cron or Windows Task Scheduler.');process.exit(1)}
const arg=process.argv.find(a=>a.startsWith('--provider='));const provider=arg?.split('=')[1];if(!['claude','codex'].includes(provider)){console.error('Explicitly select --provider=codex or --provider=claude');process.exit(1)}
await ensureLocal();
const profile=await readLocal('profile.json',{});
const clock=String(profile.dailyTime||'08:30');
const [hour,minute]=clock.split(':').map(Number);
if(!(hour>=0&&hour<=23&&minute>=0&&minute<=59))throw Error('Invalid local preference dailyTime. Set HH:MM in website first.');
const script=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'daily.mjs');
const node=process.execPath;
const plist=path.join(os.homedir(),'Library','LaunchAgents','io.argent.local-research.plist');
const enc=x=>x.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const item=x=>`<string>${enc(x)}</string>`;
const log=path.join(LOCAL,'daily.log');
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n<key>Label</key><string>io.argent.local-research</string>\n<key>ProgramArguments</key><array>${[node,script,'--provider='+provider].map(item).join('')}</array>\n<key>StartCalendarInterval</key><dict><key>Hour</key><integer>${hour}</integer><key>Minute</key><integer>${minute}</integer></dict>\n<key>RunAtLoad</key><false/>\n<key>WorkingDirectory</key>${item(path.dirname(path.dirname(script)))}\n<key>StandardOutPath</key>${item(log)}\n<key>StandardErrorPath</key>${item(log)}\n<key>EnvironmentVariables</key><dict><key>PATH</key>${item((process.env.PATH||'')+':/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin')}</dict>\n</dict></plist>\n`;
await fs.mkdir(path.dirname(plist),{recursive:true});await fs.writeFile(plist,xml,{mode:0o600});
try{execFileSync('launchctl',['bootout','gui/'+process.getuid(),plist],{stdio:'ignore'})}catch{}
try{execFileSync('launchctl',['bootstrap','gui/'+process.getuid(),plist]);console.log('Daily '+clock+' local scan scheduled for '+provider+' via launchd. macOS should be awake and CLI authenticated.')}catch(e){console.log('Wrote '+plist+'. Enable with: launchctl bootstrap gui/$(id -u) '+JSON.stringify(plist));process.exitCode=1}
console.log('Turn off: launchctl bootout gui/$(id -u) '+JSON.stringify(plist));
