import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AutonomousMissionPanel } from '../src/components/AutonomousMissionPanel';
import { VoiceController } from '../src/components/VoiceController';
import { AutonomousMissionEngine, Mission } from '../src/tools/autonomousMissionEngine';
const project:any={projectName:'t',framework:'react',files:[{name:'src/a.ts',content:'export const a=1;',language:'typescript'}],rules:[],knownIssues:[]};
(window as any).__sent=[]; (window as any).__projectFiles=project.files;
const App=()=>{
  const eng=useRef(new AutonomousMissionEngine(project)).current;
  const [m,setM]=useState<Mission|undefined>();
  const start=async(o:string)=>{let x=eng.planMission(eng.analyzeMission(eng.createMission(o)));setM({...x});x=await eng.executeMissionAsync(x,{yieldMs:300,onTick:y=>setM({...y})});setM({...x});};
  const step=(fn:(x:Mission)=>Mission|Promise<Mission>)=>async()=>{if(m){const r=await fn(m);setM({...r});}};
  return <div>
   <div style={{height:430,overflowY:'auto'}}><AutonomousMissionPanel mission={m} onStart={start}
     onPause={()=>m&&setM({...eng.requestPause(m)})} onCancel={()=>m&&setM({...eng.requestCancel(m)})}
     onResume={async()=>{if(m){const r=await eng.resumeMissionAsync(m,{yieldMs:300,onTick:y=>setM({...y})});setM({...r});}}}
     onApprove={(id,a)=>{if(m){const r=eng.approve(m,id,a);setM({...r});}}} onStep={step(x=>eng.executeNextTask(x))}
     onProvideInputs={(id,i)=>{if(m){const r=eng.provideTaskInputs(m,id,i);setM({...r});}}}/></div>
   <VoiceController onSendMessage={(t:string)=>{(window as any).__sent.push(t)}} isLoading={false} voiceLang="th-TH" activeMode="x" assistantState={'idle' as any} onInterrupt={()=>{}}/>
  </div>;};
createRoot(document.getElementById('root')!).render(<App/>);
