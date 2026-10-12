import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#05070b] px-5 py-12 text-sm text-white/45 md:px-12 lg:px-20">
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Link href="/" className="font-display text-2xl tracking-[.18em] text-white" aria-label="ORUN home">
            ORUN
          </Link>
          <p className="mt-2">Cinema Beyond Boundaries.</p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-amber">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} ORUN</p>
      </div>
    </footer>
  );
}
