import { ZodError } from "zod";
import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";
import {
  defaultAccountPreferences,
  defaultNotificationPreferences,
  defaultPrivacyPreferences,
  defaultProfilePreferences,
  profilePreferenceSchema,
  settingsUpdateSchema,
} from "@/lib/settings/schema";

export const runtime = "nodejs";

async function readSettings() {
  const session = await currentAuthSession();
  if (!session) return null;
  const profile = session.user.profiles[0] ?? null;
  const [account, profilePreference, privacy, notifications, subscription] = await Promise.all([
    prisma.accountPreference.findUnique({ where: { userId: session.userId } }),
    profile ? prisma.profilePreference.findUnique({ where: { profileId: profile.id } }) : null,
    prisma.privacyPreference.findUnique({ where: { userId: session.userId } }),
    prisma.notificationPreference.findUnique({ where: { userId: session.userId } }),
    prisma.subscription.findFirst({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } }),
  ]);
  const plan = subscription ? await prisma.subscriptionPlan.findUnique({ where: { id: subscription.planId } }) : null;
  return {
    user: {
      name: session.user.name,
      email: session.user.email,
      username: session.user.username,
      phoneNumber: session.user.phoneNumber,
      emailVerified: Boolean(session.user.emailVerifiedAt),
      phoneVerified: Boolean(session.user.phoneVerifiedAt),
      createdAt: session.user.createdAt,
      profile: profile ? { id: profile.id, name: profile.name, locale: profile.locale } : null,
    },
    account: { ...defaultAccountPreferences, ...account },
    profile: { ...defaultProfilePreferences, ...profilePreference },
    privacy: { ...defaultPrivacyPreferences, ...privacy },
    notifications: { ...defaultNotificationPreferences, ...notifications },
    subscription: plan && subscription ? {
      name: plan.name,
      status: subscription.status,
      maxQuality: plan.maxQuality,
      maxProfiles: plan.maxProfiles,
      maxStreams: plan.maxStreams,
      downloadsEnabled: plan.downloadsEnabled,
      currentPeriodEnd: subscription.currentPeriodEnd,
    } : null,
  };
}

export async function GET() {
  const settings = await readSettings();
  if (!settings) return Response.json({ error: "Authentication required" }, { status: 401 });
  return Response.json(settings, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await currentAuthSession();
    if (!session) return Response.json({ error: "Authentication required" }, { status: 401 });
    const input = settingsUpdateSchema.parse(await request.json());
    const profile = session.user.profiles[0] ?? null;
    if (input.profile && !profile) return Response.json({ error: "No viewing profile is available" }, { status: 409 });

    if (input.profile && profile) {
      const existing = await prisma.profilePreference.findUnique({ where: { profileId: profile.id } });
      profilePreferenceSchema.parse({ ...defaultProfilePreferences, ...existing, ...input.profile });
    }

    const operations = [];
    if (input.account) operations.push(prisma.accountPreference.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, ...defaultAccountPreferences, ...input.account },
      update: input.account,
    }));
    if (input.profile && profile) operations.push(prisma.profilePreference.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id, ...defaultProfilePreferences, ...input.profile },
      update: input.profile,
    }));
    if (input.privacy) operations.push(prisma.privacyPreference.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, ...defaultPrivacyPreferences, ...input.privacy },
      update: input.privacy,
    }));
    if (input.notifications) {
      operations.push(prisma.notificationPreference.upsert({
        where: { userId: session.userId },
        create: { userId: session.userId, ...defaultNotificationPreferences, ...input.notifications },
        update: input.notifications,
      }));
      if (typeof input.notifications.promotionalEmail === "boolean") operations.push(prisma.user.update({
        where: { id: session.userId }, data: { marketingOptIn: input.notifications.promotionalEmail },
      }));
    }
    for (const [category, values] of Object.entries(input)) operations.push(prisma.privacyAuditEvent.create({
      data: { userId: session.userId, action: "SETTINGS_UPDATED", category, metadata: { fields: Object.keys(values ?? {}) } },
    }));
    await prisma.$transaction(operations);
    return Response.json(await readSettings());
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Invalid settings", issues: error.issues }, { status: 422 });
    if (error instanceof Error && error.message === "INVALID_ORIGIN") return Response.json({ error: "Invalid request origin" }, { status: 403 });
    return Response.json({ error: "Settings could not be saved" }, { status: 500 });
  }
}
