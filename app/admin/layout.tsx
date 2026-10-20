import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:ReactNode}){try{await requireAdmin()}catch{redirect("/auth/login?next=/admin")}return children}
