import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const unconfiguredUrl="postgresql://unconfigured:unconfigured@127.0.0.1:1/unconfigured";

export function createPrismaClient(connectionString=process.env.DATABASE_URL){
 const adapter=new PrismaPg({connectionString:connectionString??unconfiguredUrl});
 return new PrismaClient({adapter,log:process.env.NODE_ENV==="development"?["warn","error"]:["error"]});
}
