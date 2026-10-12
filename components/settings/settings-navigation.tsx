"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const settingsLinks = [
  ["Account Overview", "/profile/settings"],
  ["Viewing Preferences", "/profile/settings/preferences"],
  ["Playback & Quality", "/profile/settings/playback"],
  ["Language & Subtitles", "/profile/settings/language"],
  ["Personalization", "/profile/settings/personalization"],
  ["Privacy & Data", "/profile/settings/privacy"],
  ["Notifications", "/profile/settings/notifications"],
  ["Security & Login", "/profile/settings/security"],
  ["Profiles & Household", "/profile/settings/household"],
  ["Accessibility", "/profile/settings/accessibility"],
  ["Subscription & Payments", "/profile/settings/subscription"],
  ["Export & Deletion", "/profile/settings/data"],
] as const;

export function SettingsNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <>
      <label className="block lg:hidden">
        <span className="sr-only">Settings category</span>
        <select value={pathname} onChange={(event) => router.push(event.target.value)} className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0b1420] px-4 text-sm text-white">
          {settingsLinks.map(([label, href]) => <option key={href} value={href}>{label}</option>)}
        </select>
      </label>
      <nav aria-label="Settings categories" className="sticky top-28 hidden self-start rounded-2xl bg-white/[.035] p-2 lg:block">
        {settingsLinks.map(([label, href]) => {
          const active = pathname === href;
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`block rounded-xl px-4 py-3 text-sm transition ${active ? "bg-amber text-black" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>{label}</Link>;
        })}
      </nav>
    </>
  );
}
