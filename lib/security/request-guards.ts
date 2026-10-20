export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) { const fetchSite=request.headers.get("sec-fetch-site");if(fetchSite&&fetchSite!=="same-origin"&&fetchSite!=="none")throw new Error("INVALID_ORIGIN");return; }
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

export async function requestRateLimitKey(request:Request,scope:string){const address=request.headers.get("cf-connecting-ip")??request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"unknown";const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(address));return`${scope}:${Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("").slice(0,24)}`}
