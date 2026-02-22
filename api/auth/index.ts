import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db';
import {
  verifyGoogleToken, isEmailAllowed, verifyPassword,
  createSession, setSessionCookie, deleteSession, clearSessionCookie,
} from '../_lib/auth';
import { setCors, checkRateLimit, requireAuth } from '../_lib/middleware';
import { badRequest, serverError, errorResponse } from '../_lib/errors';

const googleSchema = z.object({ credential: z.string().min(1) });
const loginSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase()),
  password: z.string().min(1),
});

function userJson(u: { id: string; email: string; name: string | null; picture: string | null; role: string }) {
  return { id: u.id, email: u.email, name: u.name, picture: u.picture, role: u.role };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;

  const action = typeof req.query.action === 'string' ? req.query.action : '';

  try {
    // GET /auth?action=me
    if (req.method === 'GET' && action === 'me') {
      const user = await requireAuth(req, res);
      if (!user) return;
      return res.status(200).json({ user: userJson(user) });
    }

    if (req.method !== 'POST') {
      return errorResponse(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    // POST /auth?action=google
    if (action === 'google') {
      const parsed = googleSchema.safeParse(req.body);
      if (!parsed.success) return badRequest(res, 'Missing credential', parsed.error.flatten());

      const payload = await verifyGoogleToken(parsed.data.credential);
      const allowed = await isEmailAllowed(payload.email);
      if (!allowed) {
        return errorResponse(res, 403, 'EMAIL_NOT_ALLOWED', `Access denied: ${payload.email} is not authorized`);
      }

      const user = await prisma.user.upsert({
        where: { email: payload.email },
        update: { name: payload.name, picture: payload.picture, googleSub: payload.sub, lastLoginAt: new Date() },
        create: { email: payload.email, name: payload.name, picture: payload.picture, googleSub: payload.sub, role: 'VIEWER', lastLoginAt: new Date() },
      });

      const token = await createSession(user.id);
      setSessionCookie(res, token);
      return res.status(200).json({ user: userJson(user) });
    }

    // POST /auth?action=login
    if (action === 'login') {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return badRequest(res, 'Invalid credentials', parsed.error.flatten());

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
      }

      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      const token = await createSession(user.id);
      setSessionCookie(res, token);
      return res.status(200).json({ user: userJson(user) });
    }

    // POST /auth?action=logout
    if (action === 'logout') {
      await deleteSession(req);
      clearSessionCookie(res);
      return res.status(200).json({ ok: true });
    }

    return badRequest(res, 'Unknown action: ' + action);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Token used too late')) {
      return badRequest(res, 'Google token expired, please sign in again');
    }
    return serverError(res, err);
  }
}
