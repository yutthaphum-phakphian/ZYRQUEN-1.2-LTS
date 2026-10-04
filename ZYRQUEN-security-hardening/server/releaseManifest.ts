import crypto from 'node:crypto';
export function createReleaseManifest(files:{path:string;sha256:string}[], version:string){const sorted=[...files].sort((a,b)=>a.path.localeCompare(b.path)); const manifestHash=crypto.createHash('sha256').update(JSON.stringify({version,files:sorted})).digest('hex'); return {version,files:sorted,manifestHash};}
export function verifyReleaseManifest(m:{version:string;files:{path:string;sha256:string}[];manifestHash:string}){const expected=createReleaseManifest(m.files,m.version).manifestHash; return expected===m.manifestHash;}
