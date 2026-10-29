import { WorkClaims } from './claims.ts';
let now=0;
const work = new WorkClaims(()=>now);
work.create('weekly-report','draft-v0');
const first=work.claim('weekly-report','Research',1000);
console.log('Research claims report: fence', first.fence);
try { work.claim('weekly-report','Editor'); }
catch(e) { console.log('Editor while claim is active:',(e as Error).message); }
now=1000;
const second=work.claim('weekly-report','Editor',1000);
console.log('Editor claims after expiry: fence',second.fence);
work.commit(second,'Editor','reviewed-v1');
try { work.commit(first,'Research','old-draft'); }
catch(e) { console.log('Research late commit:',(e as Error).message); }
console.log('Final report:',work.read('weekly-report').value);
