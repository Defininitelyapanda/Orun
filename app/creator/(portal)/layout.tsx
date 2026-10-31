import { redirect } from "next/navigation";
import { CreatorShell } from "@/components/creator/creator-shell";
import { requireCreator } from "@/lib/creator/access";
export const dynamic = "force-dynamic";
export default async function CreatorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let name: string | null = null;
  let message = "";
  try {
    const { creator } = await requireCreator();
    name = creator.displayName;
  } catch (error) {
    message =
      error instanceof Error ? error.message : "CREATOR_ACCESS_UNAVAILABLE";
  }
  if (message === "AUTH_REQUIRED") redirect("/auth/login?next=/creator");
  if (name) return <CreatorShell name={name}>{children}</CreatorShell>;
  return (
    <main className="grid min-h-screen place-items-center bg-[#05070b] p-6 text-white">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/[.035] p-8">
        <p className="eyebrow">ORUN Filmmaker</p>
        <h1 className="font-display text-3xl">Private access required</h1>
        <p className="mt-4 text-white/55">
          {message === "CREATOR_NOT_APPROVED"
            ? "Your filmmaker application is awaiting owner approval."
            : message === "CREATOR_SUSPENDED"
              ? "Your filmmaker access is suspended. Contact ORUN support."
              : "This workspace is available only to owner-approved filmmakers."}
        </p>
      </div>
    </main>
  );
}
