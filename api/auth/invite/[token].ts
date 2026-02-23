import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../../_lib/db';
import { hashPassword, createSession, setSessionCookie } from '../../_lib/auth';
import { setCors, checkRateLimit, allowMethods } from '../../_lib/middleware';
import { badRequest, notFound, serverError, errorResponse } from '../../_lib/errors';

const acceptSchema = z.object({
  name: z.string().min(1).max(200),
  password: z.string().min(12).max(200),
});

async function findValidToken(token: string) {
  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  if (!invite) return null;
  if (invite.usedAt) return null;
  if (invite.expiresAt < new Date()) return null;
  return invite;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) return badRequest(res, 'Missing token');

  try {
    if (req.method === 'GET') {
      const invite = await findValidToken(token);
      if (!invite) {
        return errorResponse(res, 410, 'INVITE_INVALID', 'Invitation invalide ou expirée');
      }
      return res.status(200).json({ email: invite.email, role: invite.role });
    }

    // POST — accept invite
    const invite = await findValidToken(token);
    if (!invite) {
      return errorResponse(res, 410, 'INVITE_INVALID', 'Invitation invalide ou expirée');
    }

    const parsed = acceptSchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Invalid data', parsed.error.flatten());
    }

    const { name, password } = parsed.data;
    const hash = await hashPassword(password);

    let user: Awaited<ReturnType<typeof prisma.user.create>>;
    try {
      user = await prisma.$transaction(async (tx) => {
        // Guard against duplicate accounts atomically
        const existing = await tx.user.findUnique({ where: { email: invite.email } });
        if (existing) throw Object.assign(new Error('DUPLICATE_EMAIL'), { code: 'DUPLICATE_EMAIL' });

        const created = await tx.user.create({
          data: {
            email: invite.email,
            name,
            passwordHash: hash,
            role: invite.role,
            lastLoginAt: new Date(),
          },
        });

        await tx.inviteToken.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        });

        await tx.allowedEmail.upsert({
          where: { email: invite.email },
          update: {},
          create: { email: invite.email, addedBy: invite.createdBy },
        });

        return created;
      });
    } catch (err: any) {
      if (err?.code === 'DUPLICATE_EMAIL') {
        return badRequest(res, 'Un compte existe déjà pour cet email');
      }
      throw err;
    }

    // Create session
    const sessionToken = await createSession(user.id);
    setSessionCookie(res, sessionToken);

    return res.status(201).json({
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
