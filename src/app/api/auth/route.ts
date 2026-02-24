import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import {
  verifyGoogleToken, isEmailAllowed, verifyPassword,
  createSession, deleteSessionByRequest,
  sessionCookieOptions, clearCookieOptions,
} from '@/lib/server/auth';
import { checkRateLimit, checkLoginRateLimit, resetLoginRateLimit, requireAuth, isUser } from '@/lib/server/middleware';
import { badRequest, errorResponse } from '@/lib/server/errors';

const googleSchema = z.object({ credential: z.string().min(1) });
const loginSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase()),
  password: z.string().min(8),
});

function userJson(u: { id: string; email: string; name: string | null; picture: string | null; role: string }) {
  return { id: u.id, email: u.email, name: u.name, picture: u.picture, role: u.role };
}

// GET /api/auth?action=me
export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const action = new URL(request.url).searchParams.get('action');
  if (action !== 'me') return badRequest('Unknown action: ' + action);

  const result = await requireAuth(request);
  if (!isUser(result)) return result;

  return NextResponse.json({ user: userJson(result) });
}

// POST /api/auth?action=google|login|logout
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const action = new URL(request.url).searchParams.get('action');

  try {
    const body = await request.json().catch(() => ({}));

    // POST /api/auth?action=google
    if (action === 'google') {
      const parsed = googleSchema.safeParse(body);
      if (!parsed.success) return badRequest('Missing credential', parsed.error.flatten());

      const payload = await verifyGoogleToken(parsed.data.credential);
      const allowed = await isEmailAllowed(payload.email);
      if (!allowed) {
        return errorResponse(403, 'EMAIL_NOT_ALLOWED', `Access denied: ${payload.email} is not authorized`);
      }

      const user = await prisma.user.upsert({
        where: { email: payload.email },
        update: { name: payload.name, picture: payload.picture, googleSub: payload.sub, lastLoginAt: new Date() },
        create: { email: payload.email, name: payload.name, picture: payload.picture, googleSub: payload.sub, role: 'VIEWER', lastLoginAt: new Date() },
      });

      const token = await createSession(user.id);
      const response = NextResponse.json({ user: userJson(user) });
      response.cookies.set(sessionCookieOptions(token));
      return response;
    }

    // POST /api/auth?action=login
    if (action === 'login') {
      const loginLimited = checkLoginRateLimit(request);
      if (loginLimited) return loginLimited;

      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) return badRequest('Invalid credentials', parsed.error.flatten());

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        return errorResponse(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return errorResponse(401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
      }

      resetLoginRateLimit(request);
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      const token = await createSession(user.id);
      const response = NextResponse.json({ user: userJson(user) });
      response.cookies.set(sessionCookieOptions(token));
      return response;
    }

    // POST /api/auth?action=logout
    if (action === 'logout') {
      await deleteSessionByRequest(request);
      const response = NextResponse.json({ ok: true });
      response.cookies.set(clearCookieOptions());
      return response;
    }

    return badRequest('Unknown action: ' + action);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Token used too late')) {
      return badRequest('Google token expired, please sign in again');
    }
    console.error('[API Error]', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}
