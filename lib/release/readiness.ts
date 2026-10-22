export const evidenceRequirements=[
 {kind:"MIGRATION_REHEARSAL",label:"Migration rehearsal",maxAgeDays:30},
 {kind:"BACKUP_RESTORE",label:"Backup restore drill",maxAgeDays:90},
 {kind:"ROLLBACK_EXERCISE",label:"Rollback exercise",maxAgeDays:30},
 {kind:"E2E_TEST",label:"End-to-end suite",maxAgeDays:14},
 {kind:"SECURITY_TEST",label:"Security assessment",maxAgeDays:30},
 {kind:"LOAD_TEST",label:"Load test",maxAgeDays:30},
 {kind:"OBSERVABILITY_CHECK",label:"Observability and alert check",maxAgeDays:14},
] as const;
export type EvidenceInput={kind:string;result:string;performedAt:Date;expiresAt:Date;evidenceReference:string};
export type ReadinessCheck={key:string;label:string;passed:boolean;detail:string};
export function evaluateLaunchReadiness(capabilities:Record<string,boolean>,evidence:EvidenceInput[],now=new Date()){
 const capabilityChecks:ReadinessCheck[]=[
  ["database","Managed database"],["playback","Signed playback CDN"],["adminMfa","Admin MFA encryption"],["queue","Distributed queue"],["storage","Private object storage"],["email","Transactional email"],["securityIngest","Security alert ingestion"],["analyticsRollup","Analytics scheduler authentication"],
 ].map(([key,label])=>({key:`capability:${key}`,label,passed:Boolean(capabilities[key]),detail:capabilities[key]?"Configured":"Missing runtime configuration"}));
 const payments=Boolean(capabilities.mpesa||capabilities.card);capabilityChecks.push({key:"capability:payments",label:"Production payment provider",passed:payments,detail:payments?"Configured":"Neither M-Pesa nor card provider is fully configured"});
 const evidenceChecks:ReadinessCheck[]=evidenceRequirements.map(requirement=>{const latest=evidence.filter(item=>item.kind===requirement.kind).sort((a,b)=>b.performedAt.getTime()-a.performedAt.getTime())[0],fresh=Boolean(latest&&latest.expiresAt>now&&latest.performedAt>=new Date(now.getTime()-requirement.maxAgeDays*86400000)),passed=Boolean(latest&&latest.result==="PASS"&&fresh);return{key:`evidence:${requirement.kind}`,label:requirement.label,passed,detail:!latest?"No evidence recorded":latest.result!=="PASS"?`Latest result: ${latest.result}`:!fresh?"Evidence expired or outside freshness window":latest.evidenceReference}});
 const checks=[...capabilityChecks,...evidenceChecks];return{ready:checks.every(item=>item.passed),checks,passed:checks.filter(item=>item.passed).length,total:checks.length};
}
