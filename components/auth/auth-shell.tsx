import Link from "next/link";

export function AuthShell({ title, description, notice, children, footer }: { title: string; description?: string; notice?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#0d2747,#05070b_55%)] p-5"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-xl"><Link href="/" className="font-display text-2xl tracking-[.2em]">ORUN</Link><h1 className="mt-10 font-display text-3xl">{title}</h1>{description && <p className="mt-3 text-sm leading-6 text-white/50">{description}</p>}{notice && <p role="alert" className="mt-5 rounded-xl border border-amber/20 bg-amber/10 p-3 text-sm leading-6 text-amber-100">{notice}</p>}{children}{footer && <div className="mt-6 text-sm text-white/45">{footer}</div>}</section></main>;
}
