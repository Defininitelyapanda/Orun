export const WATCH_HISTORY_KEY = "orun_watch_history_v1";
export const WATCH_HISTORY_EVENT = "orun:watch-history";

export type WatchProgress = {
  mediaId: string;
  positionSeconds: number;
  durationSeconds: number;
  completionPercent: number;
  completed: boolean;
  updatedAt: string;
};

export type WatchState = "not-watched" | "in-progress" | "watched";

export function getWatchState(positionSeconds: number, durationSeconds: number, completionThreshold = 0.9): WatchState {
  if (durationSeconds <= 0 || positionSeconds < 10) return "not-watched";
  return positionSeconds / durationSeconds >= completionThreshold ? "watched" : "in-progress";
}

export function createWatchProgress(mediaId: string, positionSeconds: number, durationSeconds: number): WatchProgress {
  const safeDuration = Math.max(0, durationSeconds);
  const safePosition = Math.min(Math.max(0, positionSeconds), safeDuration || positionSeconds);
  const completionPercent = safeDuration > 0 ? Math.min(100, Math.round((safePosition / safeDuration) * 100)) : 0;
  return { mediaId, positionSeconds: safePosition, durationSeconds: safeDuration, completionPercent, completed: completionPercent >= 90, updatedAt: new Date().toISOString() };
}

export function readWatchHistory(): Record<string, WatchProgress> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WATCH_HISTORY_KEY) ?? "{}") as Record<string, WatchProgress>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveWatchProgress(mediaId: string, positionSeconds: number, durationSeconds: number) {
  if (typeof window === "undefined" || durationSeconds <= 0) return;
  const history = readWatchHistory();
  history[mediaId] = createWatchProgress(mediaId, positionSeconds, durationSeconds);
  window.localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new CustomEvent(WATCH_HISTORY_EVENT, { detail: history[mediaId] }));
}

export function resetWatchProgress(mediaId: string) {
  if (typeof window === "undefined") return;
  const history = readWatchHistory();
  delete history[mediaId];
  window.localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new CustomEvent(WATCH_HISTORY_EVENT));
}

export function formatPlaybackTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}` : `${minutes}:${String(remainder).padStart(2, "0")}`;
}
