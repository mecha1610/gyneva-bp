import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../_lib/middleware';
import { badRequest, serverError } from '../_lib/errors';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(res, 'Invalid subscription data', parsed.error.flatten());

    const { endpoint, keys } = parsed.data;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return serverError(res, err);
  }
}
