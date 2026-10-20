import { inspectEnvironment } from "@/lib/config/environment";
import { prisma } from "@/lib/db/prisma";

export const dynamic="force-dynamic";

export async function GET(){
 const environment=inspectEnvironment();
 let database=false;
 if(environment.capabilities.database){
  try{await prisma.$queryRaw`SELECT 1`;database=true}catch{database=false}
 }
 const ready=environment.valid&&database;
 return Response.json({status:ready?"ready":"not_ready",checks:{configuration:environment.valid,database}},{status:ready?200:503,headers:{"Cache-Control":"no-store"}});
}
