import type { Metadata, Viewport } from "next";
import { Cinzel, Open_Sans } from "next/font/google";
import { SiteFooter } from "@/components/navigation/site-footer";
import { PreferencesHydrator } from "@/components/settings/preferences-hydrator";
import "./globals.css";
const display = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
const sans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"), title: { default: "ORUN — Cinema Beyond Boundaries", template: "%s · ORUN" }, description: "African stories become worlds. Discover films, series, shorts and filmmakers on ORUN.", applicationName: "ORUN", manifest: "/manifest.webmanifest", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export const viewport: Viewport = { themeColor: "#05070B", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${display.variable} ${sans.variable}`}><body><PreferencesHydrator />{children}<SiteFooter /></body></html>; }
