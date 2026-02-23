/**
 * In-Memory Rate Limiter
 *
 * Sliding window rate limiter for API routes.
 * Works in serverless (per-instance), suitable for initial production.
 * Can be upgraded to @upstash/ratelimit for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const keys = Array.from(store.keys());
  for (const key of keys) {
    const entry = store.get(key);
    if (entry && entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given key.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + config.windowSec * 1000,
    };
  }

  if (entry.count >= config.limit) {
    return { success: false, limit: config.limit, remaining: 0, reset: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: entry.resetAt,
  };
}

// ============================================
// Presets for common API patterns
// ============================================

/** Standard API: 60 requests per minute */
export const RATE_LIMIT_STANDARD: RateLimitConfig = { limit: 60, windowSec: 60 };

/** AI Generation: 10 requests per minute (expensive operations) */
export const RATE_LIMIT_AI: RateLimitConfig = { limit: 10, windowSec: 60 };

/** Auth endpoints: 5 attempts per minute */
export const RATE_LIMIT_AUTH: RateLimitConfig = { limit: 5, windowSec: 60 };

// ============================================
// Next.js Middleware Helper
// ============================================

import { NextResponse } from 'next/server';

/**
 * Apply rate limiting to an API route.
 * Returns null if allowed, or a 429 response if rate limited.
 */
export function rateLimitResponse(
  request: Request,
  config: RateLimitConfig = RATE_LIMIT_STANDARD
): NextResponse | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'anonymous';
  const url = new URL(request.url);
  const key = `${ip}:${url.pathname}`;

  const result = checkRateLimit(key, config);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset),
        },
      }
    );
  }

  return null;
}
