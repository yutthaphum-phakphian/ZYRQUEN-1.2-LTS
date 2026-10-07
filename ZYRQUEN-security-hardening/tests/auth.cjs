const fs=require('fs'),os=require('os'),path=require('path');
const A=require('./out/server/auth.js'), st=require('./out/server/missionStore.js'), F=require('./out/utils/authFetch.js');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
const T=A.parseTokens('aaaaaaaaaaaaaaaa1:alice, bbbbbbbbbbbbbbbb2:bob');
const thr=f=>{try{f();return false}catch{return true}};
ok(A.parseTokens('')?.length===0&&A.parseTokens(undefined).length===0,'unset -> auth off table');
ok(thr(()=>A.parseTokens('short:alice'))&&thr(()=>A.parseTokens('aaaaaaaaaaaaaaaa1:../x'))&&thr(()=>A.parseTokens('aaaaaaaaaaaaaaaa1'))&&thr(()=>A.parseTokens('aaaaaaaaaaaaaaaa1:a,aaaaaaaaaaaaaaaa1:b')),'bad config fails closed (short/invalid user/no user/duplicate)');
ok(A.authenticate('Bearer aaaaaaaaaaaaaaaa1',T)==='alice'&&A.authenticate('Bearer bbbbbbbbbbbbbbbb2',T)==='bob','valid tokens map to users');
ok([undefined,'','Bearer ','bearer aaaaaaaaaaaaaaaa1','Bearer aaaaaaaaaaaaaaaa','Bearer aaaaaaaaaaaaaaaa1 ','Basic xx','Bearer '+'x'.repeat(600),'Bearer aaaaaaaaaaaaaaaa1\n'].every(h=>A.authenticate(h,T)===null),'malformed/wrong/oversized/whitespace headers rejected');
// middleware
const mkRes=()=>{const r={code:200,body:null,status(n){r.code=n;return r},json(b){r.body=b;return r}};return r};
const run=(mw,h,ip='1.1.1.1')=>{const req={headers:{authorization:h},ip};const res=mkRes();let nexted=false;mw(req,res,()=>nexted=true);return {req,res,nexted}};
let now=0; const lim=new A.FailLimiter(3,1000,()=>now); const mw=A.makeAuthMiddleware(T,lim);
let r=run(mw,'Bearer aaaaaaaaaaaaaaaa1'); ok(r.nexted&&r.req.userId==='alice','middleware passes valid, sets userId');
r=run(mw,undefined); ok(!r.nexted&&r.res.code===401,'missing token -> 401');
run(mw,'Bearer wrong'); run(mw,'Bearer wrong'); r=run(mw,'Bearer aaaaaaaaaaaaaaaa1'); ok(!r.nexted&&r.res.code===429,'after repeated failures the IP is blocked (429) even with a valid token');
r=run(mw,'Bearer aaaaaaaaaaaaaaaa1','2.2.2.2'); ok(r.nexted,'other IPs unaffected'); now=1500; r=run(mw,'Bearer aaaaaaaaaaaaaaaa1'); ok(r.nexted,'block expires after window');
r=run(A.makeAuthMiddleware([]),undefined); ok(r.nexted&&r.req.userId==='local','no tokens configured -> open dev mode as "local"');
// per-user isolation via store dirs
const base=fs.mkdtempSync(path.join(os.tmpdir(),'iso-')); const dirOf=u=>path.join(base,u);
const mission=id=>JSON.stringify({missionId:id,state:'READY',objective:'o',tasks:[],events:[],updatedAt:'2026'});
st.saveMission('m1',mission('m1'),dirOf('alice'));
let nf=false; try{st.loadMission('m1',dirOf('bob'))}catch(e){nf=e.code==='NOT_FOUND'}
ok(nf&&st.listMissions(dirOf('bob')).length===0&&st.listMissions(dirOf('alice')).length===1,"bob cannot load or list alice's mission");
ok(!A.USER_ID_RE.test('../alice')&&!A.USER_ID_RE.test('')&&A.USER_ID_RE.test('alice-1'),'user id regex blocks traversal');
fs.rmSync(base,{recursive:true}); console.log(fail?fail+' FAILED':'ALL PASSED'); process.exit(fail?1:0);
