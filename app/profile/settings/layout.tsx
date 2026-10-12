import { AppShell } from "@/components/navigation/app-shell";
import { SettingsNavigation } from "@/components/settings/settings-navigation";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell><div className="mb-8"><p className="eyebrow">Your account</p><h1 className="font-display text-4xl md:text-6xl">Preferences &amp; privacy</h1><p className="mt-3 max-w-3xl text-white/55">Control your ORUN experience, privacy choices, account access, and playback preferences.</p></div><div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]"><SettingsNavigation/><div className="min-w-0">{children}</div></div></AppShell>;
}
