import { createHash,randomUUID } from "node:crypto";
import type { Prisma,PrismaClient } from "@prisma/client";

const sensitive=/password|secret|token|authorization|cookie|card|passkey|totp/i;
function redact(value:unknown):unknown{
 if(Array.isArray(value))return value.map(redact);
 if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,sensitive.test(key)?"[REDACTED]":redact(item)]));
 return value;
}

export function auditRequestContext(request:Request){
 const address=request.headers.get("cf-connecting-ip")??request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
 return{requestId:request.headers.get("cf-ray")??request.headers.get("x-request-id")??randomUUID(),correlationId:request.headers.get("x-correlation-id")??undefined,ipHash:address?createHash("sha256").update(address).digest("hex"):undefined};
}

export async function appendAuditLog(db:PrismaClient,input:{adminUserId?:string;action:string;targetType:string;targetId?:string;outcome?:string;reason?:string;before?:unknown;after?:unknown;metadata?:unknown;requestId?:string;correlationId?:string;ipHash?:string}){
 return db.auditLog.create({data:{...input,before:redact(input.before) as Prisma.InputJsonValue|undefined,after:redact(input.after) as Prisma.InputJsonValue|undefined,metadata:redact(input.metadata) as Prisma.InputJsonValue|undefined}});
}
