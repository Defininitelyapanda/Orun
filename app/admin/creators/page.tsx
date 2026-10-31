import { CreatorInvitationManager } from "@/components/admin/creator-invitation-manager";
import { requireOwner } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
export const metadata = { title: "Creator management" };
async function loadCreatorManagement() {
  try {
    return await Promise.all([
      prisma.creatorInvitation.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.creatorProfile.findMany({
        include: {
          user: { select: { email: true } },
          _count: { select: { submissions: true, permissions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);
  } catch {
    return null;
  }
}
export default async function CreatorManagementPage() {
  await requireOwner();
  const loaded = await loadCreatorManagement();
  if (!loaded)
    return (
      <>
        <p className="eyebrow">Owner-only admission</p>
        <h1 className="font-display text-4xl">Filmmaker programme</h1>
        <p className="mt-6 rounded-2xl border border-amber/20 bg-amber/5 p-5 text-amber">
          Creator data requires the configured production database and pending
          migration.
        </p>
      </>
    );
  const [invitations, creators] = loaded;
  return (
    <>
      <p className="eyebrow">Owner-only admission</p>
      <h1 className="font-display text-4xl md:text-5xl">Filmmaker programme</h1>
      <p className="mt-3 mb-8 max-w-3xl text-white/45">
        Issue invitations, approve linked accounts and suspend creator access.
        No public creator registration exists.
      </p>
      <CreatorInvitationManager
        initial={invitations.map((item) => ({
          id: item.id,
          email: item.email,
          intendedName: item.intendedName,
          productionCompany: item.productionCompany,
          status: item.status,
          expiresAt: item.expiresAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
      <h2 className="mt-12 mb-5 font-display text-3xl">Creator accounts</h2>
      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/35">
            <tr>
              <th className="p-4">Creator</th>
              <th className="p-4">Status</th>
              <th className="p-4">Titles</th>
              <th className="p-4">Submissions</th>
              <th className="p-4">Quota</th>
            </tr>
          </thead>
          <tbody>
            {creators.map((item) => (
              <tr key={item.id} className="border-t border-white/8">
                <td className="p-4">
                  <strong>{item.displayName}</strong>
                  <p className="text-xs text-white/35">{item.user.email}</p>
                </td>
                <td className="p-4">
                  {item.accessStatus.replaceAll("_", " ")}
                </td>
                <td className="p-4">{item._count.permissions}</td>
                <td className="p-4">{item._count.submissions}</td>
                <td className="p-4">
                  {(Number(item.usedUploadBytes) / 1073741824).toFixed(1)} /{" "}
                  {(Number(item.uploadQuotaBytes) / 1073741824).toFixed(0)} GB
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
