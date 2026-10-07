const { launchChromium, startUiHarness } = require('./ui-harness.cjs'); let fail=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)fail++;};
(async()=>{
 let harness; let b;
 try {
 harness=await startUiHarness();
 b=await launchChromium();
 const errors=[];
 const fresh=async()=>{const p=await b.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.goto(harness.url);return p;};
 const state=p=>p.getByTestId('mission-state').innerText();
 const waitForComplete=p=>p.getByTestId('mission-progress').getByText('100%').waitFor({timeout:8000});
 const start=async(p,o)=>{await p.locator('textarea').first().fill(o);await p.getByText('Start mission').click();};
 // 1 full run live
 let p=await fresh(); await start(p,'Inspect this project and validate');
 await p.waitForTimeout(500); const mid=await state(p); ok(['RUNNING','READY'].includes(mid),'live state while running: '+mid);
 await waitForComplete(p); ok((await state(p))==='COMPLETED','full run COMPLETED, 100%');
 // 2 pause/resume
 p=await fresh(); await start(p,'Inspect this project and validate'); await p.waitForTimeout(450); await p.getByText('Pause').click();
 await p.getByTestId('mission-state').getByText('PAUSED',{exact:true}).waitFor({timeout:5000}); const pct=await p.getByTestId('mission-progress').innerText(); ok(!pct.startsWith('100'),'paused mid-run at '+pct);
 await p.getByText('Resume',{exact:true}).click(); await waitForComplete(p); ok(true,'resume -> 100%');
 // 3 cancel
 p=await fresh(); await start(p,'Inspect this project and validate'); await p.waitForTimeout(450); await p.getByText('Cancel').click();
 await p.getByTestId('mission-state').getByText('CANCELLED',{exact:true}).waitFor({timeout:5000}); ok(true,'cancel mid-run');
 // 4 mutation + file load
 p=await fresh(); await start(p,'create a login file'); await p.getByText('Approve',{exact:true}).waitFor({timeout:8000}); ok(true,'WAITING_APPROVAL shown with Approve button');
 await p.getByText('Approve',{exact:true}).click(); await p.getByText('Load from file').waitFor({timeout:5000}); ok(true,'WAITING_USER shows Load from file');
 await p.locator('label:has-text("Load from file") input').setInputFiles(harness.fixture('login.ts'));
 await p.waitForFunction(()=>[...document.querySelectorAll('textarea')].some(t=>t.value.includes('export const login')));
 ok((await p.locator('input[placeholder="file name"]').inputValue())==='src/login.ts','file name filled from picked file');
 await p.getByText('Provide inputs & continue').click(); await waitForComplete(p);
 ok(await p.evaluate(()=>{const w=JSON.parse(localStorage.getItem('codevoice-ai:v17:workspace:t')||'{}');return (w.project?.files||[]).some(f=>f.name==='src/login.ts'&&f.content.includes('export const login'))&&(w.snapshots||[]).length>=1;}),'file really created in runtime workspace + snapshot taken first');
 // 5 chat attach
 p=await fresh(); const fi=p.locator('input[type=file]').last(); 
 await fi.setInputFiles(harness.fixture('login.ts')); await p.getByText('login.ts').first().waitFor();
 await p.locator('button[title="ส่งคำสั่ง"]').click();
 let sent=await p.evaluate(()=>window.__sent); ok(sent.length===1&&sent[0].includes('[ไฟล์แนบ: login.ts]')&&sent[0].includes('export const login'),'attach-only send contains file content');
 await fi.setInputFiles(['f1.txt','f2.txt','f3.txt','f4.txt','f5.txt','f6.txt'].map(name=>harness.fixture(name))); await p.waitForTimeout(400);
 ok(await p.locator('span:has(> button[title="เอาออก"])').count()===5,'max 5 attachments');
 await p.locator('button[title="เอาออก"]').first().click(); ok(await p.locator('button[title="เอาออก"]').count()===4,'chip removable');
 p=await fresh(); const fi2=p.locator('input[type=file]').last();
 await fi2.setInputFiles(harness.fixture('big.txt')); await p.getByText(/ไฟล์ใหญ่เกิน/).waitFor({timeout:3000}); ok(true,'oversized rejected');
 await fi2.setInputFiles(harness.fixture('bin.dat')); await p.getByText(/ไม่ใช่ข้อความ/).waitFor({timeout:3000}); ok(true,'binary rejected');
 ok(await p.locator('button[title="เอาออก"]').count()===0,'rejected files not attached');
 await p.locator('textarea').last().fill('ดูให้หน่อย'); await fi2.setInputFiles(harness.fixture('f1.txt')); await p.waitForTimeout(200); await p.locator('textarea').last().press('Enter');
 sent=await p.evaluate(()=>window.__sent); ok(sent[0].startsWith('ดูให้หน่อย')&&sent[0].includes('file 1'),'typed text + attachment via Enter');
 ok(await p.locator('button[title="เอาออก"]').count()===0,'attachments cleared after send');
 console.log('page errors:',errors.length?errors.slice(0,5):'none'); console.log(fail?`${fail} FAILED`:'ALL PASSED'); process.exitCode=fail?1:0;
 } finally {
   await b?.close();
   await harness?.close();
 }
})().catch(e=>{console.error('CRASH',e.message);process.exitCode=2});
