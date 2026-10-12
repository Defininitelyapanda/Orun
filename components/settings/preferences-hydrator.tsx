"use client";

import { useEffect } from "react";

export function PreferencesHydrator() {
  useEffect(() => {
    try {
      const value = localStorage.getItem("orun_settings_v1");
      if (!value) return;
      const settings = JSON.parse(value) as { account?: { theme?: string; reduceMotion?: boolean; highContrast?: boolean; largerText?: boolean } };
      const root = document.documentElement;
      root.dataset.theme = settings.account?.theme === "LIGHT" ? "DARK" : settings.account?.theme ?? "SYSTEM";
      root.dataset.reduceMotion = String(Boolean(settings.account?.reduceMotion));
      root.dataset.highContrast = String(Boolean(settings.account?.highContrast));
      root.dataset.largeText = String(Boolean(settings.account?.largerText));
    } catch { localStorage.removeItem("orun_settings_v1"); }
  }, []);
  return null;
}
