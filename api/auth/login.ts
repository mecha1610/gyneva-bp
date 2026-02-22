import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db';
import { verifyPassword, createSession, setSessionCookie } from '../_lib/auth';
import { setCors, checkRateLimit, allowMethods } from '../_lib/middleware';
import { badRequest, serverError, errorResponse } from '../_lib/errors';

const bodySchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase()),
  password: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Invalid credentials', parsed.error.flatten());
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Identifiants invalides');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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
    return serverError(res, err);
  }
}
