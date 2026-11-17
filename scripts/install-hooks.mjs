import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
try{
 execFileSync('git',['rev-parse','--show-toplevel'],{stdio:'ignore'});
 fs.chmodSync('.githooks/pre-commit',0o755);
 execFileSync('git',['config','--local','core.hooksPath','.githooks']);
 console.log('Git pre-commit privacy guard enabled for this checkout. npm run audit also runs in CI.');
}catch{console.log('This folder has not been initialized as a Git repository. Run git init, then npm run hooks.')} 
