import { AdminRoleName } from "@/generated/prisma/client";
import { rolePermissions } from "../lib/auth/permissions";
import { createPrismaClient } from "../lib/db/client";
import { Pbkdf2PasswordHasher } from "../lib/auth/passwords";

const prisma=createPrismaClient();

async function main(){
 const code=process.env.ORUN_OWNER_CODE?.trim();
 if(!code||!/^\d{4,12}$/.test(code))throw new Error("Set ORUN_OWNER_CODE to a private 4-12 digit code");
 const password=process.env.ORUN_OWNER_PASSWORD;
 if(!password)throw new Error("Set ORUN_OWNER_PASSWORD");
 const passwordHash=await new Pbkdf2PasswordHasher().hash(password);
 const user=await prisma.user.upsert({where:{username:code},update:{name:process.env.ORUN_OWNER_NAME?.trim()||"ORUN Owner",passwordHash,status:"ACTIVE"},create:{username:code,name:process.env.ORUN_OWNER_NAME?.trim()||"ORUN Owner",passwordHash,status:"ACTIVE",profiles:{create:{name:"Owner"}}},select:{id:true}});
 const role=await prisma.adminRole.upsert({where:{name:AdminRoleName.OWNER},update:{permissions:[...rolePermissions.OWNER]},create:{name:AdminRoleName.OWNER,permissions:[...rolePermissions.OWNER]}});
 const admin=await prisma.adminUser.upsert({where:{userId:user.id},update:{active:true},create:{userId:user.id,active:true}});
 await prisma.adminUserRole.upsert({where:{adminUserId_roleId:{adminUserId:admin.id,roleId:role.id}},update:{},create:{adminUserId:admin.id,roleId:role.id}});
 console.log("Owner access configured. Enrol MFA before enabling enforcement.");
}

main().finally(()=>prisma.$disconnect());
