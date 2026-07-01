import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

type RateLimitRule = {
  key: string;
  limit: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  identifier: string | null | undefined;
};

type RateLimitCheckResult = {
  response: NextResponse | null;
};

let warningShown = false;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiterMap = new Map<string, Ratelimit>();

function getLimiter(key: string, limit: number, window: RateLimitRule["window"]) {
  const limiterKey = `${key}:${limit}:${window}`;

  if (!limiterMap.has(limiterKey)) {
    if (!redis) {
      throw new Error("Upstash Redis is not configured.");
    }

    limiterMap.set(
      limiterKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(limit, window),
        analytics: true,
        prefix: `tjfinance:ratelimit:${key}`,
      }),
    );
  }

  const limiter = limiterMap.get(limiterKey);

  if (!limiter) {
    throw new Error(`Unable to initialize rate limiter for ${limiterKey}.`);
  }

  return limiter;
}

function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function createRateLimitResponse(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));

  const response = NextResponse.json(
    {
      error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.",
    },
    { status: 429 },
  );

  response.headers.set("Retry-After", retryAfter.toString());
  return response;
}

export async function applyRateLimit(
  rules: RateLimitRule[],
): Promise<RateLimitCheckResult> {
  if (!redis) {
    if (!warningShown) {
      warningShown = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL hoặc UPSTASH_REDIS_REST_TOKEN chưa được cấu hình. Rate limit đang bị bỏ qua.",
      );
    }

    return { response: null };
  }

  for (const rule of rules) {
    if (!rule.identifier) {
      continue;
    }

    const limiter = getLimiter(rule.key, rule.limit, rule.window);
    const result = await limiter.limit(normalizeIdentifier(rule.identifier));

    if (!result.success) {
      return {
        response: createRateLimitResponse(result.reset),
      };
    }
  }

  return { response: null };
}

export function getRateLimitIp(request: NextRequest) {
  return getRequestIp(request);
}
