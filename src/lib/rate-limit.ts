/**
 * Server-side in-memory IP rate limiter for Next.js route handlers.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  ip: string,
  maxReadsPerHour: number = parseInt(process.env.MAX_READS_PER_HOUR || "20", 10)
): { isRateLimited: boolean; remaining: number } {
  const now = Date.now();
  const oneHourAgo = now - 3600 * 1000;

  // Periodic pruning of stale records to prevent memory leaks
  if (rateLimitMap.size > 500) {
    for (const [key, record] of rateLimitMap.entries()) {
      const activeTimestamps = record.timestamps.filter((t) => t > oneHourAgo);
      if (activeTimestamps.length === 0) {
        rateLimitMap.delete(key);
      } else {
        record.timestamps = activeTimestamps;
      }
    }
  }

  const record = rateLimitMap.get(ip) || { timestamps: [] };
  const recent = record.timestamps.filter((t) => t > oneHourAgo);

  if (recent.length >= maxReadsPerHour) {
    rateLimitMap.set(ip, { timestamps: recent });
    return { isRateLimited: true, remaining: 0 };
  }

  recent.push(now);
  rateLimitMap.set(ip, { timestamps: recent });
  return { isRateLimited: false, remaining: maxReadsPerHour - recent.length };
}

/**
 * Resets the rate limiter (useful for unit tests).
 */
export function resetRateLimiter(): void {
  rateLimitMap.clear();
}
