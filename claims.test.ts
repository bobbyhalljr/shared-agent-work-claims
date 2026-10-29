import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkClaims } from './claims.ts';
function fixture() { let now=100;const c=new WorkClaims(()=>now);c.create('report','draft-v0');return {c,setNow:(n:number)=>{now=n;}}; }
test('owner can commit the claimed artifact',()=>{const {c}=fixture();const t=c.claim('report','research');assert.deepEqual(c.commit(t,'research','draft-v1'),{value:'draft-v1',revision:1});});
test('another bot must wait for an active claim',()=>{const {c}=fixture();c.claim('report','research');assert.throws(()=>c.claim('report','editor'),/busy/);assert.equal(c.read('report').value,'draft-v0');});
test('same bot cannot silently replace its active claim',()=>{const {c}=fixture();c.claim('report','research');assert.throws(()=>c.claim('report','research'),/busy/);});
test('different resources can be claimed independently',()=>{const {c}=fixture();c.create('outline','');c.claim('report','research');assert.ok(c.claim('outline','editor'));});
test('lease expires at its exact boundary',()=>{const {c,setNow}=fixture();const t=c.claim('report','research');setNow(1100);assert.throws(()=>c.commit(t,'research','late'),/expired/);assert.equal(c.read('report').value,'draft-v0');});
test('new owner gets a higher fencing number after expiry',()=>{const {c,setNow}=fixture();const a=c.claim('report','research');setNow(1100);const b=c.claim('report','editor');assert.ok(b.fence>a.fence);assert.notEqual(a.id,b.id);});
test('stale worker cannot overwrite the new result',()=>{const {c,setNow}=fixture();const a=c.claim('report','research');setNow(1100);const b=c.claim('report','editor');c.commit(b,'editor','edited-v1');assert.throws(()=>c.commit(a,'research','old-draft'),/stale/);assert.equal(c.read('report').value,'edited-v1');});
test('stale release cannot erase a new claim',()=>{const {c,setNow}=fixture();const a=c.claim('report','research');setNow(1100);const b=c.claim('report','editor');assert.throws(()=>c.release(a,'research'),/stale/);assert.equal(c.commit(b,'editor','good').value,'good');});
test('wrong owner cannot commit',()=>{const {c}=fixture();const t=c.claim('report','research');assert.throws(()=>c.commit(t,'editor','bad'),/owner/);});
test('external edit invalidates the input revision',()=>{const {c}=fixture();const t=c.claim('report','research');c.externalEdit('report','human-edit');assert.throws(()=>c.commit(t,'research','stale-input'),/source changed/);assert.equal(c.read('report').value,'human-edit');});
test('successful commit consumes the claim',()=>{const {c}=fixture();const t=c.claim('report','research');c.commit(t,'research','done');assert.throws(()=>c.commit(t,'research','again'),/stale/);});
test('release lets a new owner claim immediately',()=>{const {c}=fixture();const t=c.claim('report','research');c.release(t,'research');assert.ok(c.claim('report','editor'));});
test('claim is frozen',()=>{const {c}=fixture();const t=c.claim('report','research');assert.ok(Object.isFrozen(t));assert.throws(()=>{(t as {owner:string}).owner='editor';},TypeError);});
for(const field of ['id','owner','resource','fence','baseRevision','expiresAt'] as const){test(`tampered ${field} is refused`,()=>{const {c}=fixture();c.create('other','');const t=c.claim('report','research');const value=typeof t[field]==='number'?(t[field] as number)+1:field==='resource'?'other':'forged';assert.throws(()=>c.commit({...t,[field]:value},'research','bad'));assert.equal(c.read('report').value,'draft-v0');});}
test('read returns a detached snapshot',()=>{const {c}=fixture();c.read('report').value='changed';assert.equal(c.read('report').value,'draft-v0');});
test('invalid lifetimes are refused',()=>{const {c}=fixture();for(const n of [0,-1,0.5,NaN,Infinity,60001])assert.throws(()=>c.claim('report','research',n),/lifetime/);});
test('unknown resources cannot be claimed',()=>{const {c}=fixture();assert.throws(()=>c.claim('missing','research'),/unknown/);});
test('new coordinator does not retain state',()=>{const {c}=fixture();c.claim('report','research');const fresh=new WorkClaims();assert.throws(()=>fresh.read('report'),/unknown/);});
