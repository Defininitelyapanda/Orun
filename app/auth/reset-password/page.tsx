import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmit, PasswordField } from "@/components/auth/auth-form-controls";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <AuthShell title="Choose a new password" description="Reset links are single-use and expire after 30 minutes. Completing a reset signs out every existing session." notice={error === "password-mismatch" ? "The passwords do not match." : error ? "This reset link is invalid or expired." : undefined} footer={!token ? <Link href="/auth/forgot-password" className="text-amber">Request a new reset link</Link> : undefined}>{token && <form action="/api/auth/reset-password" method="post" className="mt-8 space-y-4"><input type="hidden" name="token" value={token} /><PasswordField id="reset-password" name="password" label="New password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} /><PasswordField id="reset-password-confirmation" name="passwordConfirmation" label="Confirm new password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} /><AuthSubmit>Reset password</AuthSubmit></form>}</AuthShell>;
}
