type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const DEFAULT_MAX = 5;
const DEFAULT_WINDOW_MS = 60 * 60 * 1000;

function getRateLimitConfig(): { max: number; windowMs: number } {
  const max = Number(process.env.RATE_LIMIT_MAX ?? DEFAULT_MAX);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? DEFAULT_WINDOW_MS);

  return {
    max: Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX,
    windowMs:
      Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS,
  };
}

export function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0];
  return (first ?? req.socket?.remoteAddress ?? "unknown").trim();
}

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const { max, windowMs } = getRateLimitConfig();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}
