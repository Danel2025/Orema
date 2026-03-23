/**
 * In-memory sliding window rate limiter.
 * For multi-server deployments, replace with Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => t > now - 3600_000);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 300_000);
}

export interface RateLimitConfig {
  max: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.max) {
    const oldest = Math.min(...entry.timestamps);
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    remaining: config.max - entry.timestamps.length,
    resetInSeconds: Math.ceil(windowMs / 1000),
  };
}

export const RATE_LIMITS = {
  LOGIN: { max: 5, windowSeconds: 900 } as const,
  PIN: { max: 3, windowSeconds: 300 } as const,
  UPLOAD: { max: 10, windowSeconds: 60 } as const,
  API: { max: 100, windowSeconds: 60 } as const,
  SETUP: { max: 3, windowSeconds: 3600 } as const,
} satisfies Record<string, RateLimitConfig>;

export function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
