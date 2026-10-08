const store={}; global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}};
const {SelfContainedRuntime:R}=require('./out/tools/selfContainedRuntime.js');
const mk=files=>({id:'p1',projectName:'p',framework:'react',files,rules:[],knownIssues:[]});
const a=new R(mk([{name:'old.ts',content:'1',language:'typescript'}])); a.executeTool('createFile',{name:'made.ts',content:'x',language:'typescript',approved:true}); a.saveMemory&&0; a.createSnapshot();
const b=new R(mk([{name:'new.ts',content:'2',language:'typescript'}]));
const st=b.getState(); const names=st.project.files.map(f=>f.name);
console.log('files:',names.join()); console.log('snapshots kept:',st.snapshots.length,'events kept:',st.events.length>0);
process.exit(names.join()==='new.ts'&&st.snapshots.length===1?0:1);
