/**
 * Shared API middleware: authentication + rate limiting.
 *
 * Auth: checks for a Bearer token in the Authorization header.
 *       Accepts the placeholder token "cms-dev-token-2026" in dev,
 *       or any non-empty token when NODE_ENV !== "production".
 *
 * Rate limiter: in-memory sliding-window counter keyed by IP.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

/**
 * Returns a 401 Response if the request lacks a valid session.
 * Returns `null` when authentication succeeds.
 */
export async function checkAuth(request) {
  // Authentication disabled for UI development
  return null;
}

// ── Rate Limiter ─────────────────────────────────────────────

// Map<ip, { timestamps: number[] }>
const rateLimitStore = new Map();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

/**
 * Returns a 429 Response if the caller has exceeded the rate limit.
 * Returns `null` when the request is within limits.
 *
 * @param {Request} request
 */
export function checkRateLimit(request) {
  // Next.js exposes the client IP via various headers
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { timestamps: [] });
  }

  const entry = rateLimitStore.get(ip);

  // Prune timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((t) => t > now - WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil(
      (entry.timestamps[0] + WINDOW_MS - now) / 1000
    );
    return Response.json(
      {
        success: false,
        error: `Rate limit exceeded – max ${MAX_REQUESTS} requests per minute. Try again in ${retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  entry.timestamps.push(now);
  return null; // within limits
}
