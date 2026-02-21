import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db.js';
import { verifyGoogleToken, isEmailAllowed, createSession, setSessionCookie } from '../_lib/auth.js';
import { setCors, checkRateLimit, allowMethods } from '../_lib/middleware.js';
import { badRequest, serverError, errorResponse } from '../_lib/errors.js';

const bodySchema = z.object({
  credential: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Missing credential', parsed.error.flatten());
    }

    // 1. Verify Google JWT server-side
    const payload = await verifyGoogleToken(parsed.data.credential);

    // 2. Check email whitelist
    const allowed = await isEmailAllowed(payload.email);
    if (!allowed) {
      return errorResponse(res, 403, 'EMAIL_NOT_ALLOWED',
        `Access denied: ${payload.email} is not authorized`);
    }

    // 3. Upsert user
    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: {
        name: payload.name,
        picture: payload.picture,
        googleSub: payload.sub,
        lastLoginAt: new Date(),
      },
      create: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        googleSub: payload.sub,
        role: 'VIEWER',
        lastLoginAt: new Date(),
      },
    });

    // 4. Create session + set cookie
    const token = await createSession(user.id);
    setSessionCookie(res, token);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Token used too late')) {
      return badRequest(res, 'Google token expired, please sign in again');
    }
    return serverError(res, err);
  }
}
