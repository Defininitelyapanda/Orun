import { createHash } from "node:crypto";
import type { ContentAccess, PrismaClient } from "@/generated/prisma/client";
import { decideEntitlement } from "./entitlement-service";

const planCodes=["STUDENT","ESSENTIAL","PREMIUM","BLACK"] as const;
type PlanCode=(typeof planCodes)[number];
const isPlanCode=(value:string):value is PlanCode=>planCodes.includes(value as PlanCode);

export class PlaybackAuthorizationError extends Error{
 constructor(public code:string,public status:number){super(code)}
}

export class PlaybackAuthorizationService{
 constructor(private db:PrismaClient){}

 async authorize(input:{userId:string;profileId:string;contentId:string;requestedQuality:number;deviceId?:string;userAgent?:string|null;ipAddress?:string|null}){
  const now=new Date();
  const [profile,film,userProfiles]=await Promise.all([
   this.db.profile.findFirst({where:{id:input.profileId,userId:input.userId},select:{id:true}}),
   this.db.film.findFirst({where:{OR:[{id:input.contentId},{slug:input.contentId}],status:"PUBLISHED"},select:{id:true,access:true}}),
   this.db.profile.findMany({where:{userId:input.userId},select:{id:true}}),
  ]);
  if(!profile)throw new PlaybackAuthorizationError("PROFILE_NOT_FOUND",404);
  if(!film)throw new PlaybackAuthorizationError("CONTENT_NOT_FOUND",404);
  const asset=await this.db.mediaAsset.findFirst({where:{filmId:film.id,kind:"VIDEO",status:"READY"},orderBy:{updatedAt:"desc"},select:{id:true}});
  if(!asset)throw new PlaybackAuthorizationError("MEDIA_NOT_READY",409);
  const [subscription,purchase,rental,grant,activeStreams]=await Promise.all([
   this.db.subscription.findFirst({where:{userId:input.userId,status:{in:["TRIALING","ACTIVE"]},startsAt:{lte:now},OR:[{currentPeriodEnd:null},{currentPeriodEnd:{gt:now}}]},orderBy:{createdAt:"desc"},select:{planId:true}}),
   this.db.purchase.findFirst({where:{userId:input.userId,filmId:film.id},select:{id:true}}),
   this.db.rental.findFirst({where:{userId:input.userId,filmId:film.id,expiresAt:{gt:now}},orderBy:{expiresAt:"desc"},select:{expiresAt:true}}),
   this.db.entitlement.findFirst({where:{userId:input.userId,filmId:film.id,revokedAt:null,startsAt:{lte:now},OR:[{expiresAt:null},{expiresAt:{gt:now}}]},orderBy:{qualityLimit:"desc"},select:{qualityLimit:true,expiresAt:true}}),
   this.db.playbackSession.count({where:{endedAt:null,lastHeartbeatAt:{gt:new Date(now.getTime()-2*60_000)},profileId:{in:userProfiles.map(item=>item.id)}}}),
  ]);
  const plan=subscription?await this.db.subscriptionPlan.findUnique({where:{id:subscription.planId},select:{code:true,maxStreams:true,maxQuality:true}}):null;
  const code=plan&&isPlanCode(plan.code)?plan.code:undefined;
  const decision=decideEntitlement({contentAccess:film.access as ContentAccess,purchase:Boolean(purchase||grant),rentalExpiresAt:rental?.expiresAt??undefined,plan:code,availableInCountry:true,activeStreams,maxStreams:plan?.maxStreams??1},now);
  if(!decision.allowed||!decision.qualityLimit)throw new PlaybackAuthorizationError(decision.reason,403);
  const qualityLimit=Math.min(decision.qualityLimit,plan?.maxQuality??decision.qualityLimit,grant?.qualityLimit??2160,input.requestedQuality);
  const fingerprintHash=createHash("sha256").update(`${input.userId}:${input.userAgent??"unknown"}`).digest("hex");
  const ipHash=input.ipAddress?createHash("sha256").update(input.ipAddress).digest("hex"):null;
  let device=input.deviceId?await this.db.device.findFirst({where:{id:input.deviceId,userId:input.userId},select:{id:true}}):await this.db.device.findFirst({where:{userId:input.userId,fingerprintHash},orderBy:{lastActiveAt:"desc"},select:{id:true}});
  if(input.deviceId&&!device)throw new PlaybackAuthorizationError("DEVICE_NOT_FOUND",404);
  if(!device)device=await this.db.device.create({data:{userId:input.userId,name:"Web browser",fingerprintHash,lastIpHash:ipHash,browser:input.userAgent?.slice(0,250)},select:{id:true}});
  else await this.db.device.update({where:{id:device.id},data:{lastActiveAt:now,lastIpHash:ipHash}});
  const sessionId=crypto.randomUUID();
  await this.db.playbackSession.create({data:{id:sessionId,profileId:profile.id,deviceId:device.id,filmId:film.id,maxQuality:qualityLimit,tokenId:sessionId}});
  return{filmId:film.id,sessionId,qualityLimit,decision};
 }
}
