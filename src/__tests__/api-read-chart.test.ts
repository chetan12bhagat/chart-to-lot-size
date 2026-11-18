import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/lib/ts-route-handler";
import { NextRequest } from "next/server";
import { resetRateLimiter } from "@/lib/rate-limit";

// Mock @anthropic-ai/sdk
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  instrument: "gold",
                  direction: "buy",
                  entry: 2650.5,
                  sl: 2640.0,
                  tp: 2670.0,
                }),
              },
            ],
          }),
        },
      };
    }),
  };
});

function createDummyPng(sizeInBytes = 200, name = "chart.png"): File {
  const bytes = new Uint8Array(sizeInBytes);
  // PNG signature
  bytes[0] = 0x89;
  bytes[1] = 0x50;
  bytes[2] = 0x4e;
  bytes[3] = 0x47;
  return new File([bytes], name, { type: "image/png" });
}

describe("POST /api/read-chart", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetRateLimiter();
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    delete process.env.APP_PASSWORD;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("returns 400 when no image is uploaded", async () => {
    const formData = new FormData();
    const req = new NextRequest("http://localhost:3000/api/read-chart", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No image uploaded");
  });

  it("returns 400 for invalid file type", async () => {
    const formData = new FormData();
    const textFile = new File(["some text"], "notes.txt", { type: "text/plain" });
    formData.append("image", textFile);

    const req = new NextRequest("http://localhost:3000/api/read-chart", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Only PNG, JPEG, WebP or GIF");
  });

  it("returns 413 when image exceeds 5 MB", async () => {
    const formData = new FormData();
    // 5MB + 1 byte
    const bigFile = createDummyPng(5 * 1024 * 1024 + 1, "big.png");
    formData.append("image", bigFile);

    const req = new NextRequest("http://localhost:3000/api/read-chart", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toContain("max 5 MB");
  });

  it("returns 401 when password protection is active and wrong password supplied", async () => {
    process.env.APP_PASSWORD = "secret-trading-pwd";
    const formData = new FormData();
    formData.append("image", createDummyPng());

    const req = new NextRequest("http://localhost:3000/api/read-chart", {
      method: "POST",
      headers: {
        "X-App-Password": "wrong-password",
      },
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Wrong password");
  });

  it("returns 200 when password protection is active and correct password supplied", async () => {
    process.env.APP_PASSWORD = "secret-trading-pwd";
    const formData = new FormData();
    formData.append("image", createDummyPng());

    const req = new NextRequest("http://localhost:3000/api/read-chart", {
      method: "POST",
      headers: {
        "X-App-Password": "secret-trading-pwd",
      },
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instrument).toBe("gold");
    expect(body.direction).toBe("buy");
    expect(body.entry).toBe(2650.5);
    expect(body.success).toBe(true);
  });

  it("returns 503 if ANTHROPIC_API_KEY is not configured on the server", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const formData = new FormData();
    formData.append("image", createDummyPng());

    const req = new NextRequest("http://localhost:3000/api/read-chart", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("ANTHROPIC_API_KEY is not configured");
  });

  it("returns 200 and parsed chart values on successful AI extraction", async () => {
    const formData = new FormData();
    formData.append("image", createDummyPng());

    const req = new NextRequest("http://localhost:3000/api/read-chart", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instrument).toBe("gold");
    expect(body.direction).toBe("buy");
    expect(body.entry).toBe(2650.5);
    expect(body.sl).toBe(2640.0);
    expect(body.tp).toBe(2670.0);
  });

  it("enforces rate limits per IP", async () => {
    process.env.MAX_READS_PER_HOUR = "2";

    const makeReq = () => {
      const formData = new FormData();
      formData.append("image", createDummyPng());
      return new NextRequest("http://localhost:3000/api/read-chart", {
        method: "POST",
        headers: {
          "x-forwarded-for": "198.51.100.42",
        },
        body: formData,
      });
    };

    const res1 = await POST(makeReq());
    expect(res1.status).toBe(200);

    const res2 = await POST(makeReq());
    expect(res2.status).toBe(200);

    // 3rd should be rate-limited
    const res3 = await POST(makeReq());
    expect(res3.status).toBe(429);
    const body = await res3.json();
    expect(body.error).toContain("Too many chart reads");
  });
});
