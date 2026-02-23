import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { z } from 'zod';
import { prisma } from '../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAuth, requireAdmin } from '../_lib/middleware';
import { badRequest, serverError } from '../_lib/errors';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const sendSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  url: z.string().optional().default('/'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['POST'])) return;

  const action = typeof req.query.action === 'string' ? req.query.action : '';

  // POST ?action=send — admin only
  if (action === 'send') {
    try {
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      const parsed = sendSchema.safeParse(req.body);
      if (!parsed.success) return badRequest(res, 'Invalid notification data', parsed.error.flatten());

      const { title, body, url } = parsed.data;

      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL}`,
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!,
      );

      const subscriptions = await prisma.pushSubscription.findMany();
      const payload = JSON.stringify({ title, body, url });
      const staleIds: string[] = [];

      await Promise.allSettled(
        subscriptions.map(async sub => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
            );
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) staleIds.push(sub.id);
          }
        })
      );

      if (staleIds.length > 0) {
        await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } });
      }

      return res.status(200).json({ ok: true, sent: subscriptions.length - staleIds.length, removed: staleIds.length });
    } catch (err) {
      return serverError(res, err);
    }
  }

  // POST (no action) — subscribe, requires auth
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
