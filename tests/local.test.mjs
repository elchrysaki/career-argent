import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeOpportunity,slug,ROOT} from '../scripts/lib.mjs';

test('normalizer always marks untrusted AI results for human review',()=>{
 const r=normalizeOpportunity({id:'demo',title:'Illustrative sample only',org:'Example Institute',url:'https://example.edu/apply',region:'USA',fundingTier:'paid',verification:'official',eligibility:'eligible',tags:['AI'],deadline:'2027-10-20'});
 assert.equal(r.verification,'review');assert.equal(r.region,'USA');assert.equal(r.deadline,'2027-10-20');
});
test('bad URLs cannot be imported as records',()=>{
 assert.throws(()=>normalizeOpportunity({title:'Bad',org:'Fake',url:'javascript:alert(1)'}));
});
test('public HTML includes no embedded opportunity or contact dataset',async()=>{
 const html=await fs.readFile(path.join(ROOT,'index.html'),'utf8');
 assert.doesNotMatch(html,/id=["']seed-(data|contacts)["']/);
});
test('user templates contain no preferences or opportunities',async()=>{
 const p=JSON.parse(await fs.readFile(path.join(ROOT,'templates/profile.template.json'),'utf8'));
 const o=JSON.parse(await fs.readFile(path.join(ROOT,'templates/opportunities.template.json'),'utf8'));
 assert.equal(p.displayName,'');assert.deepEqual(p.topics,[]);assert.deepEqual(o.records,[]);
});
test('safe slug for research contact IDs',()=>assert.equal(slug('An Example Lab'), 'an-example-lab'));
