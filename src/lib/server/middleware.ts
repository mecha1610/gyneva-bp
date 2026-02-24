import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { User } from '@prisma/client';
import { getSessionUser } from './auth';
import { errorResponse } from './errors';

// ===== Rate Limiting (in-memory, per IP) =====

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000;

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function checkRateLimit(req: NextRequest): NextResponse | null {
  const ip = getIp(req);
  const now = Date.now();

  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    const retryAfter = String(Math.ceil((entry.resetAt - now) / 1000));
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': retryAfter } }
    );
  }

  return null;
}

// ===== Login Rate Limiting =====

const loginRateMap = new Map<string, { count: number; resetAt: number }>();
const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000;

export function checkLoginRateLimit(req: NextRequest): NextResponse | null {
  const ip = getIp(req);
  const now = Date.now();

  const entry = loginRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    loginRateMap.set(ip, { count: 1, resetAt: now + LOGIN_RATE_WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > LOGIN_RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: `Too many login attempts. Retry after ${retryAfter}s`, code: 'LOGIN_RATE_LIMIT' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  return null;
}

export function resetLoginRateLimit(req: NextRequest): void {
  loginRateMap.delete(getIp(req));
}

// ===== Auth Middleware =====

export async function requireAuth(req: NextRequest): Promise<User | NextResponse> {
  const user = await getSessionUser(req);
  if (!user) {
    return errorResponse(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<User | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== 'ADMIN') {
    return errorResponse(403, 'FORBIDDEN', 'Admin access required');
  }
  return result;
}

// ===== Type guard =====

export function isUser(val: User | NextResponse): val is User {
  return !(val instanceof NextResponse);
}
