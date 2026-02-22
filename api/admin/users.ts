import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAdmin } from '../_lib/middleware';
import { badRequest, notFound, serverError } from '../_lib/errors';

const addEmailSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase()),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['GET', 'POST', 'DELETE'])) return;

  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    // GET — list allowed emails + registered users
    if (req.method === 'GET') {
      const [allowedEmails, users] = await Promise.all([
        prisma.allowedEmail.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
            role: true,
            googleSub: true,
            passwordHash: true,
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      const usersWithAuthType = users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        picture: u.picture,
        role: u.role,
        authType: u.googleSub ? 'google' : u.passwordHash ? 'password' : 'invited',
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }));

      return res.status(200).json({ allowedEmails, users: usersWithAuthType });
    }

    // POST — add allowed email
    if (req.method === 'POST') {
      const parsed = addEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(res, 'Invalid email', parsed.error.flatten());
      }

      const existing = await prisma.allowedEmail.findUnique({
        where: { email: parsed.data.email },
      });
      if (existing) {
        return badRequest(res, 'Email already authorized');
      }

      const entry = await prisma.allowedEmail.create({
        data: {
          email: parsed.data.email,
          addedBy: admin.email,
        },
      });

      return res.status(201).json({ allowedEmail: entry });
    }

    // DELETE — remove allowed email
    const email = typeof req.query.email === 'string'
      ? req.query.email.toLowerCase()
      : null;

    if (!email) {
      return badRequest(res, 'Missing email query parameter');
    }

    // Prevent removing own email
    if (email === admin.email) {
      return badRequest(res, 'Cannot remove your own email');
    }

    const deleted = await prisma.allowedEmail.deleteMany({ where: { email } });
    if (deleted.count === 0) {
      return notFound(res, 'Email not found in allowed list');
    }

    return res.status(200).json({ ok: true, email });
  } catch (err) {
    return serverError(res, err);
  }
}
