import { z } from "zod";

export const themeSchema = z.enum(["SYSTEM", "DARK", "LIGHT"]);
export const qualitySchema = z.enum(["AUTO", "DATA_SAVER", "SD", "HD", "FULL_HD", "UHD"]);
export const subtitleModeSchema = z.enum(["ALWAYS_ON", "OFF", "MATCH_CONTENT"]);

export const accountPreferenceSchema = z.object({
  theme: themeSchema,
  interfaceLanguage: z.enum(["en", "sw"]),
  regionCode: z.string().length(2).toUpperCase().nullable(),
  timeZone: z.string().min(1).max(80),
  currency: z.enum(["KES", "USD"]),
  dateTimeFormat: z.enum(["REGIONAL", "DMY_24H", "MDY_12H"]),
  browsingDensity: z.enum(["COMFORTABLE", "COMPACT"]),
  reduceMotion: z.boolean(),
  highContrast: z.boolean(),
  largerText: z.boolean(),
});

const profilePreferenceBaseSchema = z.object({
  contentLanguage: z.enum(["en", "sw"]),
  preferredGenres: z.array(z.string().min(1).max(40)).max(20),
  durationMin: z.number().int().min(0).max(360),
  durationMax: z.number().int().min(1).max(480),
  preferredCountries: z.array(z.string().length(2).toUpperCase()).max(20),
  audioLanguages: z.array(z.string().min(2).max(12)).max(10),
  subtitleLanguages: z.array(z.string().min(2).max(12)).max(10),
  hideWatched: z.boolean(),
  allowOutsideGenres: z.boolean(),
  showDescriptions: z.boolean(),
  showRatings: z.boolean(),
  showMetadata: z.boolean(),
  personalizedRecommendations: z.boolean(),
  useWatchHistory: z.boolean(),
  useRatings: z.boolean(),
  continueWatchingPersonalization: z.boolean(),
  homepagePersonalization: z.boolean(),
  browsingPersonalization: z.boolean(),
  playbackQuality: qualitySchema,
  autoplayNext: z.boolean(),
  autoplayTrailers: z.boolean(),
  rememberPosition: z.boolean(),
  resumeUnfinished: z.boolean(),
  showPlaybackControls: z.boolean(),
  defaultSubtitles: subtitleModeSchema,
  preferredAudioTrack: z.string().min(1).max(40),
  playbackSpeed: z.union([z.literal(0.75), z.literal(1), z.literal(1.25), z.literal(1.5)]),
  skipIntro: z.boolean(),
  skipRecap: z.boolean(),
  lowerBandwidth: z.boolean(),
  adaptiveQuality: z.boolean(),
  subtitleSize: z.enum(["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"]),
  subtitleColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  subtitleBackground: z.string().regex(/^#[0-9A-F]{6}$/i),
  subtitleBackgroundOpacity: z.number().int().min(0).max(100),
  subtitleOutline: z.enum(["NONE", "SHADOW", "OUTLINE"]),
  subtitlePosition: z.enum(["BOTTOM", "RAISED"]),
});
export const profilePreferenceSchema = profilePreferenceBaseSchema.refine((value) => value.durationMin <= value.durationMax, {
  message: "Minimum duration cannot exceed maximum duration",
  path: ["durationMin"],
});

export const privacyPreferenceSchema = z.object({
  productAnalytics: z.boolean(),
  personalizedMeasurement: z.boolean(),
  diagnosticReporting: z.boolean(),
});

export const notificationPreferenceSchema = z.object({
  promotionalEmail: z.boolean(),
  newReleaseEmail: z.boolean(),
  recommendationEmail: z.boolean(),
  watchlistEmail: z.boolean(),
  pushNewReleases: z.boolean(),
  pushWatchlist: z.boolean(),
  pushRecommendations: z.boolean(),
  pushSubscriptionReminders: z.boolean(),
  inAppAnnouncements: z.boolean(),
  inAppAccountEvents: z.boolean(),
  inAppContentAvailability: z.boolean(),
  inAppBillingEvents: z.boolean(),
});

export const settingsUpdateSchema = z.object({
  account: accountPreferenceSchema.partial().strict().optional(),
  profile: profilePreferenceBaseSchema.partial().strict().optional(),
  privacy: privacyPreferenceSchema.partial().strict().optional(),
  notifications: notificationPreferenceSchema.partial().strict().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "No settings supplied");

export type AccountPreferences = z.infer<typeof accountPreferenceSchema>;
export type ProfilePreferences = z.infer<typeof profilePreferenceSchema>;
export type PrivacyPreferences = z.infer<typeof privacyPreferenceSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferenceSchema>;

export const defaultAccountPreferences: AccountPreferences = {
  theme: "SYSTEM", interfaceLanguage: "en", regionCode: "KE", timeZone: "Africa/Nairobi",
  currency: "KES", dateTimeFormat: "REGIONAL", browsingDensity: "COMFORTABLE",
  reduceMotion: false, highContrast: false, largerText: false,
};

export const defaultProfilePreferences: ProfilePreferences = {
  contentLanguage: "en", preferredGenres: [], durationMin: 0, durationMax: 240,
  preferredCountries: [], audioLanguages: [], subtitleLanguages: [], hideWatched: false,
  allowOutsideGenres: true, showDescriptions: true, showRatings: true, showMetadata: true,
  personalizedRecommendations: true, useWatchHistory: true, useRatings: true,
  continueWatchingPersonalization: true, homepagePersonalization: true, browsingPersonalization: false,
  playbackQuality: "AUTO", autoplayNext: true, autoplayTrailers: true, rememberPosition: true,
  resumeUnfinished: true, showPlaybackControls: true, defaultSubtitles: "MATCH_CONTENT",
  preferredAudioTrack: "ORIGINAL", playbackSpeed: 1, skipIntro: false, skipRecap: false,
  lowerBandwidth: false, adaptiveQuality: true, subtitleSize: "MEDIUM", subtitleColor: "#FFFFFF",
  subtitleBackground: "#000000", subtitleBackgroundOpacity: 75, subtitleOutline: "SHADOW",
  subtitlePosition: "BOTTOM",
};

export const defaultPrivacyPreferences: PrivacyPreferences = {
  productAnalytics: false, personalizedMeasurement: false, diagnosticReporting: false,
};

export const defaultNotificationPreferences: NotificationPreferences = {
  promotionalEmail: false, newReleaseEmail: false, recommendationEmail: false, watchlistEmail: false,
  pushNewReleases: false, pushWatchlist: false, pushRecommendations: false,
  pushSubscriptionReminders: false, inAppAnnouncements: true, inAppAccountEvents: true,
  inAppContentAvailability: true, inAppBillingEvents: true,
};

const qualityPixels = { AUTO: Number.POSITIVE_INFINITY, DATA_SAVER: 360, SD: 480, HD: 720, FULL_HD: 1080, UHD: 2160 } as const;
export function effectivePlaybackQuality(preference: z.infer<typeof qualitySchema>, planLimit: number) {
  return Math.min(qualityPixels[preference], planLimit);
}
