export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (origin !== new URL(request.url).origin) throw new Error("INVALID_ORIGIN");
}

const attempts = new Map<string, { count: number; resetsAt: number }>();
export function assertRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = attempts.get(key);
  if (!current || current.resetsAt <= now) {
    attempts.set(key, { count: 1, resetsAt: now + windowMs });
    return;
  }
  if (current.count >= limit) throw new Error("RATE_LIMITED");
  current.count += 1;
}
