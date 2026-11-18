import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimiter } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("permits requests within hourly limit", () => {
    const ip = "192.168.1.100";
    const res1 = checkRateLimit(ip, 3);
    expect(res1.isRateLimited).toBe(false);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(ip, 3);
    expect(res2.isRateLimited).toBe(false);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(ip, 3);
    expect(res3.isRateLimited).toBe(false);
    expect(res3.remaining).toBe(0);

    // 4th request exceeds limit
    const res4 = checkRateLimit(ip, 3);
    expect(res4.isRateLimited).toBe(true);
    expect(res4.remaining).toBe(0);
  });

  it("isolates rate limits by client IP", () => {
    const ip1 = "10.0.0.1";
    const ip2 = "10.0.0.2";

    // Exceed limit on IP 1
    checkRateLimit(ip1, 1);
    const blockedIp1 = checkRateLimit(ip1, 1);
    expect(blockedIp1.isRateLimited).toBe(true);

    // IP 2 should still be allowed
    const allowedIp2 = checkRateLimit(ip2, 1);
    expect(allowedIp2.isRateLimited).toBe(false);
  });
});
