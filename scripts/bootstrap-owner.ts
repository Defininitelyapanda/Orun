import { AdminRoleName, PrismaClient } from "@prisma/client";
import { rolePermissions } from "../lib/auth/permissions";

const prisma=new PrismaClient();

async function main(){
 const email=process.env.ORUN_OWNER_EMAIL?.trim().toLowerCase();
 if(!email)throw new Error("Set ORUN_OWNER_EMAIL to an existing, verified user email");
 const user=await prisma.user.findUnique({where:{email},select:{id:true,emailVerifiedAt:true,status:true}});
 if(!user||user.status!=="ACTIVE"||!user.emailVerifiedAt)throw new Error("Owner must be an existing active user with a verified email");
 const role=await prisma.adminRole.upsert({where:{name:AdminRoleName.OWNER},update:{permissions:[...rolePermissions.OWNER]},create:{name:AdminRoleName.OWNER,permissions:[...rolePermissions.OWNER]}});
 const admin=await prisma.adminUser.upsert({where:{userId:user.id},update:{active:true},create:{userId:user.id,active:true}});
 await prisma.adminUserRole.upsert({where:{adminUserId_roleId:{adminUserId:admin.id,roleId:role.id}},update:{},create:{adminUserId:admin.id,roleId:role.id}});
 console.log(`Owner access granted to ${email}. Enrol MFA before enabling enforcement.`);
}

main().finally(()=>prisma.$disconnect());
