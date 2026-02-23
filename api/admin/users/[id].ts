import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAdmin } from '../../_lib/middleware';
import { badRequest, notFound, serverError } from '../../_lib/errors';

const updateSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional(),
  name: z.string().min(1).max(200).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['PUT', 'DELETE'])) return;

  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const userId = typeof req.query.id === 'string' ? req.query.id : '';
    if (!userId) return badRequest(res, 'Missing user ID');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return notFound(res, 'User not found');

    if (req.method === 'PUT') {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(res, 'Invalid data', parsed.error.flatten());
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: parsed.data,
        select: { id: true, email: true, name: true, role: true },
      });

      return res.status(200).json({ user: updated });
    }

    // DELETE
    if (userId === admin.id) {
      return badRequest(res, 'Impossible de supprimer votre propre compte');
    }

    // Delete user (cascade deletes sessions, plans, scenarios)
    await prisma.user.delete({ where: { id: userId } });

    // Also remove from AllowedEmail if present
    await prisma.allowedEmail.deleteMany({ where: { email: user.email } }).catch(err => console.warn('[admin] Failed to remove allowedEmail on user delete:', err));

    return res.status(200).json({ ok: true, id: userId });
  } catch (err) {
    return serverError(res, err);
  }
}
