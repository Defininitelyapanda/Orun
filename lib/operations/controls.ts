import { createHash,timingSafeEqual } from "node:crypto";

export function secureTokenMatches(expected:string|undefined,provided:string|null){
 if(!expected||!provided)return false;
 const a=Buffer.from(expected),b=Buffer.from(provided);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export function securityFingerprint(source:string,title:string,identity?:string){return createHash("sha256").update(`${source.trim().toLowerCase()}\0${title.trim().toLowerCase()}\0${identity?.trim().toLowerCase()??""}`).digest("hex")}
export function aggregateDimensionHash(metric:string,dimensions:Record<string,string>){return createHash("sha256").update(`${metric}\0${JSON.stringify(Object.fromEntries(Object.entries(dimensions).sort(([a],[b])=>a.localeCompare(b))))}`).digest("hex")}
export function containsSecretMaterial(value:unknown,path=""):boolean{
 if(!value||typeof value!=="object")return false;
 return Object.entries(value).some(([key,item])=>/secret|token|password|credential|private.?key|authorization/i.test(`${path}.${key}`)||containsSecretMaterial(item,`${path}.${key}`));
}
export function nextIncidentStatus(current:string,action:"INVESTIGATE"|"MITIGATE"|"RESOLVE"){
 const allowed:Record<string,Record<string,string>>={OPEN:{INVESTIGATE:"INVESTIGATING"},INVESTIGATING:{MITIGATE:"MITIGATED",RESOLVE:"RESOLVED"},MITIGATED:{RESOLVE:"RESOLVED"}};
 return allowed[current]?.[action]??null;
}
