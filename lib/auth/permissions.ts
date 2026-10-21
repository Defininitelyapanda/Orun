import type { AdminRoleName } from "@prisma/client";
export const rolePermissions:Record<AdminRoleName,readonly string[]>={
 OWNER:["*"],SUPER_ADMIN:["*"],TECHNICAL_ADMIN:["system:read","system:write","security:read","security:write","settings:read","settings:write","media:read","media:write","audit:read"],
 CONTENT_ADMIN:["catalog:read","catalog:write","media:read","media:write","cms:read","cms:write","taxonomy:read","taxonomy:write"],EDITOR:["catalog:read","catalog:write","cms:read","cms:write"],MODERATOR:["moderation:read","moderation:write","catalog:read"],FINANCE:["finance:read","finance:write","payments:read","payments:write","subscriptions:read","subscriptions:write","audit:read"],ANALYST:["analytics:read","catalog:read","finance:read"],SUPPORT:["users:read","users:sessions:write","subscriptions:read","payments:read","support:write"],CUSTOMER_SUPPORT:["users:read","users:sessions:write","subscriptions:read","payments:read","support:write"]
};
export function roleAllows(role:AdminRoleName,permission:string){const permissions=rolePermissions[role];return permissions.includes("*")||permissions.includes(permission)}
export function anyRoleAllows(roles:readonly AdminRoleName[],permission:string){return roles.some(role=>roleAllows(role,permission))}
