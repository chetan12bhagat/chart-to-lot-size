import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_CHART_PROMPT, parseChartJson } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
};

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

function verifyPassword(supplied: string, expected: string): boolean {
  if (!supplied || !expected) return false;
  try {
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // 1. Password Protection (if configured)
  const expectedPassword = process.env.APP_PASSWORD;
  if (expectedPassword) {
    const suppliedPassword = req.headers.get("X-App-Password") || "";
    if (!verifyPassword(suppliedPassword, expectedPassword)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
  }

  // 2. Parse Multipart Form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }

  // 3. File Type Validation
  let mediaType = (file.type || "").toLowerCase();
  mediaType = MIME_ALIASES[mediaType] || mediaType;

  if (!ALLOWED_TYPES.has(mediaType)) {
    const fileName = file.name || "";
    const extIndex = fileName.lastIndexOf(".");
    const ext = extIndex !== -1 ? fileName.substring(extIndex).toLowerCase() : "";
    if (EXT_TO_MIME[ext]) {
      mediaType = EXT_TO_MIME[ext];
    } else {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WebP or GIF images are allowed" },
        { status: 400 }
      );
    }
  }

  // 4. File Size Validation (max 5 MB)
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 5 MB)" },
      { status: 413 }
    );
  }

  // 5. Rate Limiting per IP
  const clientIp = getClientIp(req);
  const { isRateLimited } = checkRateLimit(clientIp);
  if (isRateLimited) {
    return NextResponse.json(
      { error: "Too many chart reads. Try again later." },
      { status: 429 }
    );
  }

  // 6. Check Anthropic API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured on the server. " +
          "Set the key in a .env file or environment variable to use AI chart reading, or type prices manually.",
      },
      { status: 503 }
    );
  }

  // 7. Read File Bytes to Base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString("base64");

  const anthropic = new Anthropic({
    apiKey,
  });

  const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: CLAUDE_CHART_PROMPT,
            },
          ],
        },
      ],
    });

    const textParts: string[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        textParts.push(block.text);
      }
    }
    const rawReply = textParts.join("");

    const parsed = parseChartJson(rawReply);
    return NextResponse.json({ ...parsed, success: true }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "The AI service is busy. Try again in a minute." },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Server is not configured correctly" },
        { status: 500 }
      );
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      return NextResponse.json(
        { error: "The AI service timed out. Try again." },
        { status: 504 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "Could not read the chart" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Could not read the chart" },
      { status: 502 }
    );
  }
}
