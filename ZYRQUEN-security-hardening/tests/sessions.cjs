const A=require('./out/server/auth.js'), {SessionStore}=require('./out/server/sessions.js'), F=require('./out/utils/authFetch.js');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
const T=A.parseTokens('aaaaaaaaaaaaaaaa1:alice,bbbbbbbbbbbbbbbb2:bob');
let now=1_000_000; const clock=()=>now;
const ss=new SessionStore(3600_000,3,clock); const lim=new A.FailLimiter(3,1000,clock);
// sessions
const a=ss.create('alice'); ok(ss.verify(a.token)?.userId==='alice','session verifies');
ok(!ss.verify(undefined)&&!ss.verify('')&&!ss.verify('x'.repeat(200))&&!ss.verify('nope'),'unknown/empty/oversized session tokens rejected');
now+=3600_000; ok(ss.verify(a.token)===null&&ss.size()===0,'expired session rejected and swept'); now=1_000_000;
const b=ss.create('bob'); const r=ss.refresh(b.token); ok(r&&r.userId==='bob'&&r.token!==b.token&&!ss.verify(b.token)&&ss.verify(r.token),'refresh rotates: old token dead, new alive');
ok(ss.refresh('bogus')===null,'refresh of invalid token refused');
ok(ss.revoke(r.token)&&!ss.verify(r.token)&&!ss.revoke(r.token),'logout revokes once');
const x1=ss.create('a'),x2=ss.create('b'); now+=10; const x3=ss.create('c'); now+=10; const x4=ss.create('d');
ok(ss.size()===3&&!ss.verify(x1.token)&&ss.verify(x4.token),'bounded: oldest evicted at cap, newest valid');
ok(ss.revokeUser('c')===1&&!ss.verify(x3.token),'revokeUser kills a user\'s sessions');
const toks=new Set(Array.from({length:500},()=>new SessionStore().create('u').token)); ok(toks.size===500&&[...toks].every(t=>t.length>=43),'500 tokens unique, >=256-bit');
// login
let L=A.login('aaaaaaaaaaaaaaaa1','1.1.1.1',T,ss,lim); ok(L.status===200&&L.body.userId==='alice'&&ss.verify(L.body.token),'login with access key issues session');
ok(A.login('wrong','1.1.1.1',T,ss,lim).status===401&&A.login(123,'1.1.1.1',T,ss,lim).status===401&&A.login(undefined,'1.1.1.1',T,ss,lim).status===401&&A.login('wrong','1.1.1.1',T,ss,lim).status===429,'3 failures (wrong/non-string/missing) are 401, the 4th is 429');
ok(A.login('aaaaaaaaaaaaaaaa1','1.1.1.1',T,ss,lim).status===429,'blocked IP cannot login even with valid key'); now+=1500;
ok(A.login('aaaaaaaaaaaaaaaa1','1.1.1.1',T,ss,lim).status===200,'block expires');
ok(A.login('x','9.9.9.9',[],ss,lim).body.authRequired===false,'auth off -> login reports authRequired:false');
// middleware with sessions: static key must NOT work on normal routes
const mkRes=()=>{const r={code:200,body:null,status(n){r.code=n;return r},json(b){r.body=b;return r}};return r};
const run=(mw,h,ip='3.3.3.3')=>{const req={headers:{authorization:h},ip};const res=mkRes();let n=false;mw(req,res,()=>n=true);return{req,res,n}};
const mw=A.makeAuthMiddleware(T,new A.FailLimiter(50,1000,clock),ss);
ok(!run(mw,'Bearer aaaaaaaaaaaaaaaa1').n,'static access key rejected on normal routes');
const s1=ss.create('bob'); const m=run(mw,'Bearer '+s1.token); ok(m.n&&m.req.userId==='bob','session token accepted, userId=bob');
now+=3600_001; ok(!run(mw,'Bearer '+s1.token).n,'expired session rejected by middleware');
// client fetch
const store={}; global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}};
global.Event=global.Event||class{constructor(t){this.type=t}};
(async()=>{
 const calls=[],events=[]; let nextStatus=200; let refreshCalls=0;
 const w={location:{origin:'https://app.test'},dispatchEvent:e=>{events.push(e.type)},fetch:async(i,init={})=>{const u=String(i);calls.push({u,init});
   if(u.endsWith('/api/session/refresh')){refreshCalls++;await new Promise(r=>setTimeout(r,10));return{ok:true,status:200,json:async()=>({token:'NEW'+refreshCalls,expiresAt:Date.now()+3600_000})}}
   if(u.endsWith('/api/login'))return{ok:true,status:200,json:async()=>({token:'T1',userId:'alice',expiresAt:Date.now()+3600_000,authRequired:true})};
   return{ok:nextStatus<400,status:nextStatus,json:async()=>({})}}};
 F.installAuthFetch(w);
 const h=c=>new Headers(c.init.headers||{}).get('authorization');
 await w.fetch('/api/x'); ok(!h(calls[0]),'no session -> no header');
 await F.loginWithKey('key',w.fetch); ok(F.getAuthToken()==='T1','loginWithKey stores session');
 calls.length=0; await w.fetch('/api/missions'); await w.fetch('https://evil.test/api/missions'); await w.fetch('/static/a.js'); await w.fetch('/api/missions',{headers:{Authorization:'Bearer custom'}});
 ok(h(calls[0])==='Bearer T1'&&!h(calls[1])&&!h(calls[2])&&h(calls[3])==='Bearer custom','token only to same-origin /api; explicit header kept');
 // near expiry -> single refresh even with parallel requests
 F.setAuthSession('OLD',Date.now()+5*60_000); calls.length=0; refreshCalls=0;
 await Promise.all([w.fetch('/api/a'),w.fetch('/api/b'),w.fetch('/api/c')]);
 ok(refreshCalls===1&&calls.filter(c=>!c.u.includes('refresh')).every(c=>h(c)==='Bearer NEW1'),'3 parallel requests near expiry trigger ONE refresh and all use the new token');
 // 401 -> cleared + event
 nextStatus=401; await w.fetch('/api/missions'); ok(F.getAuthToken()===''&&events.includes('codevoice-auth-expired'),'401 clears session and emits expired event');
 nextStatus=200; F.setAuthSession('T2',Date.now()+3600_000); nextStatus=401; await w.fetch('/api/m',{headers:{Authorization:'Bearer custom'}}); ok(F.getAuthToken()==='T2','401 on an explicit-header request does not wipe the session');
 nextStatus=200; await F.logout(w.fetch); ok(F.getAuthToken()==='','logout clears session');
 console.log(fail?fail+' FAILED':'ALL PASSED'); process.exit(fail?1:0);
})();
