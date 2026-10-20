import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { AuthService } from "@/server/services/auth-service";
import { assertRateLimit,assertSameOrigin,requestRateLimitKey } from "@/lib/security/request-guards";
export const runtime="nodejs";
export async function POST(request:Request){try{assertSameOrigin(request);assertRateLimit(await requestRateLimitKey(request,"password-reset"),4,60*60_000);const{email}=z.object({email:z.string().email().max(320)}).parse(Object.fromEntries(await request.formData()));await new AuthService(prisma,new Pbkdf2PasswordHasher()).createReset(email);return NextResponse.redirect(new URL("/auth/login?reset=sent",request.url),303)}catch(error){if(error instanceof Error&&error.message==="RATE_LIMITED")return NextResponse.json({error:"Too many attempts. Try again later."},{status:429});return NextResponse.redirect(new URL("/auth/login?reset=sent",request.url),303)}}
