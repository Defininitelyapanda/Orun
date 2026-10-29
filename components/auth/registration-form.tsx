"use client";

import { useState } from "react";
import { AuthSubmit, PasswordField, authInputClass } from "./auth-form-controls";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";

const choices = [{ value: "email", label: "Email" }, { value: "phone", label: "Phone" }, { value: "username", label: "Username" }] as const;

export function RegistrationForm() {
  const [kind, setKind] = useState<(typeof choices)[number]["value"]>("email");
  const labels = { email: "Email address", phone: "Phone number", username: "Username" };
  const placeholders = { email: "you@example.com", phone: "+254712345678", username: "your.username" };
  return <form action="/api/auth/register" method="post" className="mt-8 space-y-4">
    <fieldset><legend className="text-sm text-white/65">Create your account with</legend><div className="mt-2 grid grid-cols-3 gap-2">{choices.map((choice) => <label key={choice.value} className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-xs font-semibold ${kind === choice.value ? "border-amber bg-amber/10 text-amber" : "border-white/10 text-white/50"}`}><input className="sr-only" type="radio" name="identifierType" value={choice.value} checked={kind === choice.value} onChange={() => setKind(choice.value)} />{choice.label}</label>)}</div></fieldset>
    <label htmlFor="display-name" className="block text-sm text-white/65">Display name <span className="text-white/30">(optional)</span><input id="display-name" type="text" name="name" autoComplete="name" maxLength={80} className={authInputClass} /></label>
    <label htmlFor="registration-identifier" className="block text-sm text-white/65">{labels[kind]}<input id="registration-identifier" required type={kind === "email" ? "email" : "text"} inputMode={kind === "phone" ? "tel" : kind === "email" ? "email" : "text"} name="identifier" autoComplete="username" placeholder={placeholders[kind]} className={authInputClass} /></label>
    <PasswordField id="registration-password" name="password" label="Password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} />
    <PasswordField id="registration-password-confirmation" name="passwordConfirmation" label="Confirm password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} />
    <p className="text-xs leading-5 text-white/40">Use at least {MIN_PASSWORD_LENGTH} characters. A longer, unique password is safer, and your browser may offer to generate and save one.</p>
    <AuthSubmit>Create account</AuthSubmit>
  </form>;
}
