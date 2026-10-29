import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmit, PasswordField, authInputClass } from "@/components/auth/auth-form-controls";

export const metadata = { title: "Administrator sign in" };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const notice = params.error === "rate-limit" ? "Too many attempts. Please try again later." : params.error ? "The administrator code or password is incorrect, or access is temporarily locked." : undefined;
  return <AuthShell title="Administrator access" description="Use the dedicated administrator code and password. Member identifiers are not accepted here." notice={notice} footer={<Link href="/auth/login">Return to member sign in</Link>}><form action="/api/auth/admin-login" method="post" className="mt-8 space-y-4"><label htmlFor="admin-code" className="block text-sm text-white/65">Administrator code<input id="admin-code" required inputMode="numeric" pattern="[0-9]{4,12}" type="text" name="code" autoComplete="username" className={authInputClass}/></label><PasswordField id="admin-password" name="password" label="Password" autoComplete="current-password"/>{params.next && <input type="hidden" name="next" value={params.next}/>}<AuthSubmit>Open administration</AuthSubmit></form></AuthShell>;
}
