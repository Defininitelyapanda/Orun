import { describe, expect, it } from "vitest";
import {
  defaultAccountPreferences, defaultPrivacyPreferences, effectivePlaybackQuality,
  profilePreferenceSchema, settingsUpdateSchema,
} from "../lib/settings/schema";
import { assertSameOrigin } from "../lib/security/request-guards";

describe("settings safety", () => {
  it("defaults optional analytics and public-facing choices to private", () => {
    expect(defaultPrivacyPreferences).toEqual({ productAnalytics: false, personalizedMeasurement: false, diagnosticReporting: false });
    expect(defaultAccountPreferences.reduceMotion).toBe(false);
  });

  it("rejects unknown and invalid preference values", () => {
    expect(() => settingsUpdateSchema.parse({ account: { theme: "NEON", isAdmin: true } })).toThrow();
    expect(() => profilePreferenceSchema.parse({})).toThrow();
  });

  it("prevents a quality preference from overriding the subscription limit", () => {
    expect(effectivePlaybackQuality("UHD", 720)).toBe(720);
    expect(effectivePlaybackQuality("DATA_SAVER", 2160)).toBe(360);
    expect(effectivePlaybackQuality("AUTO", 1080)).toBe(1080);
  });

  it("rejects cross-origin mutations", () => {
    expect(() => assertSameOrigin(new Request("https://orun.example/api/settings", { headers: { origin: "https://evil.example" } }))).toThrow("INVALID_ORIGIN");
    expect(() => assertSameOrigin(new Request("https://orun.example/api/settings", { headers: { origin: "https://orun.example" } }))).not.toThrow();
  });
});
