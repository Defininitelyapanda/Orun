import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./client";
const holder=globalThis as unknown as{prisma?:PrismaClient};
export const prisma=holder.prisma??createPrismaClient();
if(process.env.NODE_ENV!=="production")holder.prisma=prisma;
