import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegistrationForm } from "@/components/auth/registration-form";

const errors: Record<string, string> = { "identifier-in-use": "That sign-up identifier is already in use.", "password-mismatch": "The passwords do not match.", "rate-limit": "Too many registration attempts. Please try again later.", unavailable: "Registration is temporarily unavailable.", invalid: "Check the information entered and try again." };
export default async function Register({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthShell title="Begin your journey" description="Create an ORUN account using an email address, phone number, or username." notice={error ? errors[error] ?? errors.invalid : undefined} footer={<>Already here? <Link href="/auth/login" className="text-amber">Sign in</Link></>}><RegistrationForm /></AuthShell>;
}
