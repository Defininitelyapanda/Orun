import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { AuthService } from "@/server/services/auth-service";
import { assertRateLimit,assertSameOrigin,requestRateLimitKey } from "@/lib/security/request-guards";
export const runtime="nodejs";
export async function POST(request:Request){try{assertSameOrigin(request);assertRateLimit(await requestRateLimitKey(request,"login"),8,15*60_000);const data=z.object({email:z.string().email().max(320),password:z.string().min(1).max(200)}).parse(Object.fromEntries(await request.formData()));const result=await new AuthService(prisma,new Pbkdf2PasswordHasher()).authenticate(data.email,data.password);const response=NextResponse.redirect(new URL("/profile",request.url),303);response.cookies.set("orun_session",result.token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:30*24*3600,priority:"high"});return response}catch(error){if(error instanceof Error&&error.message==="RATE_LIMITED")return NextResponse.json({error:"Too many attempts. Try again later."},{status:429});return NextResponse.json({error:"Invalid email or password"},{status:401})}}
