import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { AuthService } from "@/server/services/auth-service";
import { assertRateLimit,assertSameOrigin,requestRateLimitKey } from "@/lib/security/request-guards";
export const runtime="nodejs";
export async function POST(request:Request){try{assertSameOrigin(request);assertRateLimit(await requestRateLimitKey(request,"register"),4,60*60_000);const registration=await prisma.platformSetting.findUnique({where:{key:"auth.publicRegistration"}});if(registration?.value===false)return NextResponse.json({error:"Registration is temporarily unavailable"},{status:403});const data=z.object({name:z.string().trim().min(2).max(80),email:z.string().email().max(320),password:z.string().min(12).max(200)}).parse(Object.fromEntries(await request.formData()));await new AuthService(prisma,new Pbkdf2PasswordHasher()).register(data);return NextResponse.redirect(new URL("/auth/login?registered=1",request.url),303)}catch(error){if(error instanceof Error&&error.message==="RATE_LIMITED")return NextResponse.json({error:"Too many attempts. Try again later."},{status:429});return NextResponse.json({error:"Registration could not be completed"},{status:422})}}
