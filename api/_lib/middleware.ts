import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { User } from '@prisma/client';
import { getSessionUser } from './auth';
import { errorResponse } from './errors';

// ===== CORS =====

const ALLOWED_ORIGINS = [
  process.env.ALLOWED_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

export function setCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

// ===== Rate Limiting (in-memory, per IP) =====

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

export function checkRateLimit(req: VercelRequest, res: VercelResponse): boolean {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown';
  const now = Date.now();

  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    errorResponse(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
    return true;
  }

  return false;
}

// ===== Login Rate Limiting (stricter, per IP) =====

const loginRateMap = new Map<string, { count: number; resetAt: number }>();
const LOGIN_RATE_LIMIT = 5; // max failed attempts per window
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function getIp(req: VercelRequest): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown';
}

export function checkLoginRateLimit(req: VercelRequest, res: VercelResponse): boolean {
  const ip = getIp(req);
  const now = Date.now();

  const entry = loginRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    loginRateMap.set(ip, { count: 1, resetAt: now + LOGIN_RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > LOGIN_RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    errorResponse(res, 429, 'LOGIN_RATE_LIMIT', `Too many login attempts. Retry after ${retryAfter}s`);
    return true;
  }

  return false;
}

export function resetLoginRateLimit(req: VercelRequest): void {
  const ip = getIp(req);
  loginRateMap.delete(ip);
}

// ===== Auth Middleware =====

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<User | null> {
  const user = await getSessionUser(req);
  if (!user) {
    errorResponse(res, 401, 'UNAUTHORIZED', 'Authentication required');
    return null;
  }
  return user;
}

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<User | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'ADMIN') {
    errorResponse(res, 403, 'FORBIDDEN', 'Admin access required');
    return null;
  }
  return user;
}

// ===== Method check =====

export function allowMethods(
  req: VercelRequest,
  res: VercelResponse,
  methods: string[],
): boolean {
  if (!methods.includes(req.method || '')) {
    res.setHeader('Allow', methods.join(', '));
    errorResponse(res, 405, 'METHOD_NOT_ALLOWED', `Allowed: ${methods.join(', ')}`);
    return false;
  }
  return true;
}
