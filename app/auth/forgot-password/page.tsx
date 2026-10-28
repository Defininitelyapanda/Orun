import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmit, authInputClass } from "@/components/auth/auth-form-controls";

export default function ForgotPassword() {
  return <AuthShell title="Reset your password" description="Enter your email, phone number, or username. For privacy, ORUN always returns the same response. Recovery currently requires a verified email address."><form action="/api/auth/forgot-password" method="post" className="mt-8 space-y-4"><label htmlFor="recovery-identifier" className="block text-sm text-white/65">Account identifier<input id="recovery-identifier" required type="text" name="identifier" autoComplete="username" className={authInputClass} /></label><AuthSubmit>Send reset link</AuthSubmit></form></AuthShell>;
}
