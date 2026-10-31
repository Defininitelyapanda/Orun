import { prisma } from "@/lib/db/prisma";
import { currentAuthSession } from "@/lib/auth/session-cookie";

export const creatorOperations = ["READ", "EDIT_METADATA", "UPLOAD", "SUBMIT", "VIEW_ANALYTICS"] as const;
export type CreatorOperation = (typeof creatorOperations)[number];

export async function requireCreator() {
  const session = await currentAuthSession();
  if (!session) throw new Error("AUTH_REQUIRED");
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId } });
  if (!creator) throw new Error("CREATOR_ACCESS_REQUIRED");
  if (creator.accessStatus !== "APPROVED") throw new Error(creator.accessStatus === "SUSPENDED" ? "CREATOR_SUSPENDED" : "CREATOR_NOT_APPROVED");
  return { session, creator };
}

export async function requireCreatorFilm(filmId: string, operation: CreatorOperation) {
  const access = await requireCreator();
  const grant = await prisma.creatorFilmPermission.findUnique({
    where: { creatorProfileId_filmId: { creatorProfileId: access.creator.id, filmId } },
  });
  if (!grant?.active || !grant.permissions.includes(operation)) throw new Error("NOT_AUTHORIZED");
  return { ...access, grant };
}

export async function requireOwnedSubmission(submissionId: string) {
  const access = await requireCreator();
  const submission = await prisma.filmSubmission.findFirst({
    where: { id: submissionId, creatorProfileId: access.creator.id },
    include: { versions: { orderBy: { version: "desc" } } },
  });
  if (!submission) throw new Error("SUBMISSION_NOT_FOUND");
  return { ...access, submission };
}
