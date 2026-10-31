export const QUALIFIED_VIEW_SECONDS = 30;
export const QUALIFIED_VIEW_PERCENT = 0.25;
export const COMPLETION_THRESHOLD = 0.9;

export type PlaybackObservation = { sessionId: string; occurredAt: Date; positionSeconds: number; durationSeconds: number };
export type FilmMetric = { qualifiedViews: number; watchSeconds: number; startedViews: number; completedViews: number; completionRate: number };

export function calculateFilmMetrics(events: readonly PlaybackObservation[]): FilmMetric {
  const sessions = new Map<string, PlaybackObservation[]>();
  for (const event of events) {
    if (!event.sessionId || event.durationSeconds <= 0 || event.positionSeconds < 0) continue;
    const list = sessions.get(event.sessionId) ?? []; list.push(event); sessions.set(event.sessionId, list);
  }
  let qualifiedViews = 0, watchSeconds = 0, completedViews = 0;
  for (const observations of sessions.values()) {
    observations.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    const duration = Math.max(...observations.map(item => item.durationSeconds));
    let furthest = 0, previous = 0;
    for (const item of observations) {
      const current = Math.min(item.positionSeconds, duration);
      if (current > previous) watchSeconds += Math.min(current - previous, 30);
      previous = Math.max(previous, current); furthest = Math.max(furthest, current);
    }
    if (furthest >= Math.min(QUALIFIED_VIEW_SECONDS, duration * QUALIFIED_VIEW_PERCENT)) qualifiedViews++;
    if (furthest / duration >= COMPLETION_THRESHOLD) completedViews++;
  }
  const startedViews = sessions.size;
  return { qualifiedViews, watchSeconds: Math.round(watchSeconds), startedViews, completedViews, completionRate: startedViews ? completedViews / startedViews : 0 };
}
