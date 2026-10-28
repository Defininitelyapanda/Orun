import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmit, authInputClass } from "@/components/auth/auth-form-controls";

export default async function Verify({ searchParams }: { searchParams: Promise<{ channel?: string; delivery?: string; error?: string }> }) {
  const params = await searchParams;
  const notice = params.error ? "The verification code is invalid or expired." : params.delivery === "sent" ? `A six-digit code was sent to your ${params.channel === "phone" ? "phone" : "email"}.` : params.delivery === "unavailable" ? `Your account was created, but ${params.channel === "phone" ? "SMS" : "email"} delivery is not configured. Contact support before signing in.` : undefined;
  return <AuthShell title="Verify your account" description="Enter the same email address or phone number used during registration and the six-digit code." notice={notice}><form action="/api/auth/verify" method="post" className="mt-8 space-y-4"><label htmlFor="verification-identifier" className="block text-sm text-white/65">Email address or phone number<input id="verification-identifier" required type="text" name="identifier" autoComplete="username" className={authInputClass} /></label><label htmlFor="verification-code" className="block text-sm text-white/65">Verification code<input id="verification-code" required type="text" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" className={`${authInputClass} tracking-[.35em]`} /></label><AuthSubmit>Verify account</AuthSubmit></form></AuthShell>;
}
