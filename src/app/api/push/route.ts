import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { checkRateLimit, requireAuth, requireAdmin, isUser } from '@/lib/server/middleware';
import { badRequest, serverError } from '@/lib/server/errors';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

const sendSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  url: z.string().optional().default('/'),
});

// POST /api/push — subscribe (auth) or send (admin, ?action=send)
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const action = new URL(request.url).searchParams.get('action');

  if (action === 'send') {
    const admin = await requireAdmin(request);
    if (!isUser(admin)) return admin;

    try {
      const body = await request.json().catch(() => ({}));
      const parsed = sendSchema.safeParse(body);
      if (!parsed.success) return badRequest('Invalid notification data', parsed.error.flatten());

      const { title, body: notifBody, url } = parsed.data;

      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL}`,
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!,
      );

      const subscriptions = await prisma.pushSubscription.findMany();
      const payload = JSON.stringify({ title, body: notifBody, url });
      const staleIds: string[] = [];

      await Promise.allSettled(
        subscriptions.map(async sub => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
            );
          } catch (err: unknown) {
            const e = err as { statusCode?: number };
            if (e.statusCode === 410 || e.statusCode === 404) staleIds.push(sub.id);
          }
        })
      );

      if (staleIds.length > 0) {
        await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } });
      }

      return NextResponse.json({
        ok: true,
        sent: subscriptions.length - staleIds.length,
        removed: staleIds.length,
      });
    } catch (err) {
      return serverError(err);
    }
  }

  // Default: subscribe
  const user = await requireAuth(request);
  if (!isUser(user)) return user;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid subscription data', parsed.error.flatten());

    const { endpoint, keys } = parsed.data;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
