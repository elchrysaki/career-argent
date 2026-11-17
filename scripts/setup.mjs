import {ensureLocal,LOCAL} from './lib.mjs';
await ensureLocal();
console.log('Private workspace created at '+LOCAL);
console.log('Run npm start, then open http://127.0.0.1:4178 and visit Local preferences.');
console.log('This project does NOT send anything to GitHub and does NOT schedule AI until you opt in.');
