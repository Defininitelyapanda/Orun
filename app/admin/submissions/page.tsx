import Link from "next/link";
import { requireOwner } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
export const metadata = { title: "Filmmaker submissions" };
async function loadSubmissions() {
  try {
    return await prisma.filmSubmission.findMany({
      include: {
        creator: true,
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  } catch {
    return null;
  }
}
export default async function FilmmakerSubmissionsPage() {
  await requireOwner();
  const items = await loadSubmissions();
  if (!items)
    return (
      <>
        <p className="eyebrow">Owner review centre</p>
        <h1 className="font-display text-4xl">Filmmaker submissions</h1>
        <p className="mt-6 rounded-2xl border border-amber/20 bg-amber/5 p-5 text-amber">
          Submission data requires the configured production database and
          pending migration.
        </p>
      </>
    );
  return (
    <>
      <p className="eyebrow">Owner review centre</p>
      <h1 className="mb-8 font-display text-4xl md:text-5xl">
        Filmmaker submissions
      </h1>
      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/35">
            <tr>
              <th className="p-4">Film</th>
              <th className="p-4">Creator</th>
              <th className="p-4">Editorial</th>
              <th className="p-4">Processing</th>
              <th className="p-4">Version</th>
              <th className="p-4">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/8">
                <td className="p-4">
                  <Link
                    className="font-semibold hover:text-amber"
                    href={`/admin/submissions/${item.id}`}
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="p-4">{item.creator.displayName}</td>
                <td className="p-4">{item.status.replaceAll("_", " ")}</td>
                <td className="p-4">
                  {item.processingStatus.replaceAll("_", " ")}
                </td>
                <td className="p-4">v{item.currentVersionNumber}</td>
                <td className="p-4 text-white/40">
                  {item.updatedAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
