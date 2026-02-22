import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAdmin } from '../_lib/middleware';
import { badRequest, serverError } from '../_lib/errors';

const INVITE_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

const createInviteSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase()),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional().default('VIEWER'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (req.method === 'GET') {
      const invites = await prisma.inviteToken.findMany({
        where: {
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ invites });
    }

    // POST — create invite
    const parsed = createInviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Invalid invite data', parsed.error.flatten());
    }

    const { email, role } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest(res, 'Un utilisateur avec cet email existe déjà');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_DURATION_MS);

    const invite = await prisma.inviteToken.create({
      data: {
        token,
        email,
        role,
        expiresAt,
        createdBy: admin.email,
      },
    });

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || '';
    const link = origin + '/?invite=' + token;

    return res.status(201).json({ invite, link });
  } catch (err) {
    return serverError(res, err);
  }
}
