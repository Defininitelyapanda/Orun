import { AdminRoleName } from "@/generated/prisma/client";
import { rolePermissions } from "../lib/auth/permissions";
import { createPrismaClient } from "../lib/db/client";
import { Pbkdf2PasswordHasher } from "../lib/auth/passwords";

const prisma=createPrismaClient();

async function main(){
 const email=process.env.ORUN_OWNER_EMAIL?.trim().toLowerCase();
 if(!email)throw new Error("Set ORUN_OWNER_EMAIL");
 let user=await prisma.user.findUnique({where:{email},select:{id:true,emailVerifiedAt:true,status:true}});
 if(!user){const password=process.env.ORUN_OWNER_PASSWORD;if(!password||password.length<12)throw new Error("For a new owner, set ORUN_OWNER_PASSWORD to at least 12 characters");const passwordHash=await new Pbkdf2PasswordHasher().hash(password),created=await prisma.user.create({data:{email,name:process.env.ORUN_OWNER_NAME?.trim()||"ORUN Owner",passwordHash,status:"ACTIVE",emailVerifiedAt:new Date(),profiles:{create:{name:"Owner"}}},select:{id:true,emailVerifiedAt:true,status:true}});user=created}
 if(user.status!=="ACTIVE"||!user.emailVerifiedAt)throw new Error("Owner must be active with a verified email");
 const role=await prisma.adminRole.upsert({where:{name:AdminRoleName.OWNER},update:{permissions:[...rolePermissions.OWNER]},create:{name:AdminRoleName.OWNER,permissions:[...rolePermissions.OWNER]}});
 const admin=await prisma.adminUser.upsert({where:{userId:user.id},update:{active:true},create:{userId:user.id,active:true}});
 await prisma.adminUserRole.upsert({where:{adminUserId_roleId:{adminUserId:admin.id,roleId:role.id}},update:{},create:{adminUserId:admin.id,roleId:role.id}});
 console.log(`Owner access granted to ${email}. Enrol MFA before enabling enforcement.`);
}

main().finally(()=>prisma.$disconnect());
