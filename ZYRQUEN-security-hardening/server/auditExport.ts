export function exportAuditChain(entries:{seq:number;hash:string;prevHash:string}[]){return entries.map(e=>({seq:e.seq,prevHash:e.prevHash,hash:e.hash}));}
