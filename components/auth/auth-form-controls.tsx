"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

export const authInputClass = "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-white placeholder:text-white/25";

export function PasswordField({ id, name, label, autoComplete, minLength = 1 }: { id: string; name: string; label: string; autoComplete: "current-password" | "new-password"; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return <label htmlFor={id} className="block text-sm text-white/65">{label}<span className="relative block"><input id={id} required minLength={minLength} maxLength={200} type={visible ? "text" : "password"} name={name} autoComplete={autoComplete} className={`${authInputClass} pr-12`} /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-1 top-3 grid h-10 w-10 place-items-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>;
}

export function AuthSubmit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="primary-action w-full disabled:cursor-wait disabled:opacity-60" type="submit">{pending && <LoaderCircle className="animate-spin" size={17} />}{pending ? "Please wait…" : children}</button>;
}
