import { z } from "zod";
import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit,assertSameOrigin } from "@/lib/security/request-guards";
import { issuePlaybackToken } from "@/lib/video/playback-token";
import { PlaybackAuthorizationError,PlaybackAuthorizationService } from "@/server/services/playback-authorization-service";

const inputSchema=z.object({profileId:z.string().min(1).max(128),contentId:z.string().min(1).max(160),requestedQuality:z.number().int().min(360).max(2160),deviceId:z.string().min(1).max(128).optional()}).strict();

export async function POST(request:Request){
 try{
  assertSameOrigin(request);
  const session=await currentAuthSession();
  if(!session)return Response.json({error:"AUTH_REQUIRED"},{status:401});
  assertRateLimit(`playback:${session.userId}`,30,60_000);
  const parsed=inputSchema.safeParse(await request.json());
  if(!parsed.success)return Response.json({error:"INVALID_REQUEST"},{status:400});
  const cdnUrl=process.env.CDN_URL;
  if(!cdnUrl||!process.env.PLAYBACK_SIGNING_SECRET||process.env.PLAYBACK_SIGNING_SECRET.length<32)throw new Error("PLAYBACK_NOT_CONFIGURED");
  const address=request.headers.get("cf-connecting-ip")??request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??null;
  const authorization=await new PlaybackAuthorizationService(prisma).authorize({...parsed.data,userId:session.userId,userAgent:request.headers.get("user-agent"),ipAddress:address});
  const token=await issuePlaybackToken({userId:session.userId,profileId:parsed.data.profileId,contentId:authorization.filmId,maxQuality:authorization.qualityLimit,sessionId:authorization.sessionId});
  return Response.json({...authorization.decision,qualityLimit:authorization.qualityLimit,playbackToken:token,manifestUrl:`${cdnUrl.replace(/\/$/,"")}/hls/${authorization.filmId}/master.m3u8?token=${encodeURIComponent(token)}`,sessionId:authorization.sessionId});
 }catch(error){
  if(error instanceof PlaybackAuthorizationError)return Response.json({error:error.code},{status:error.status});
  if(error instanceof Error&&error.message==="RATE_LIMITED")return Response.json({error:"RATE_LIMITED"},{status:429});
  if(error instanceof Error&&error.message==="INVALID_ORIGIN")return Response.json({error:"INVALID_ORIGIN"},{status:403});
  console.error("Playback authorization failed",error instanceof Error?error.message:"UNKNOWN");
  return Response.json({error:"PLAYBACK_UNAVAILABLE"},{status:503});
 }
}
