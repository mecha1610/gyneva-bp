import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/server/db';
import { checkRateLimit, requireAdmin, isUser } from '@/lib/server/middleware';
import { badRequest, notFound, serverError } from '@/lib/server/errors';

const INVITE_DURATION_MS = 48 * 60 * 60 * 1000;

const addEmailSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase()),
});

const createInviteSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase()),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional().default('VIEWER'),
});

// GET /api/admin/users?scope=invites|<default>
export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const admin = await requireAdmin(request);
  if (!isUser(admin)) return admin;

  try {
    const scope = new URL(request.url).searchParams.get('scope');

    if (scope === 'invites') {
      const invites = await prisma.inviteToken.findMany({
        where: { usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ invites });
    }

    const [allowedEmails, users] = await Promise.all([
      prisma.allowedEmail.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.user.findMany({
        select: {
          id: true, email: true, name: true, picture: true, role: true,
          googleSub: true, passwordHash: true, lastLoginAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const usersWithAuthType = users.map(u => ({
      id: u.id, email: u.email, name: u.name, picture: u.picture, role: u.role,
      authType: u.googleSub ? 'google' : u.passwordHash ? 'password' : 'invited',
      lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
    }));

    return NextResponse.json({ allowedEmails, users: usersWithAuthType });
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/admin/users?scope=invites|<default: add email>
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const admin = await requireAdmin(request);
  if (!isUser(admin)) return admin;

  try {
    const scope = new URL(request.url).searchParams.get('scope');
    const body = await request.json().catch(() => ({}));

    if (scope === 'invites') {
      const parsed = createInviteSchema.safeParse(body);
      if (!parsed.success) return badRequest('Invalid invite data', parsed.error.flatten());

      const { email, role } = parsed.data;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return badRequest('Un utilisateur avec cet email existe déjà');

      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + INVITE_DURATION_MS);
      const invite = await prisma.inviteToken.create({
        data: { token, email, role, expiresAt, createdBy: admin.email },
      });

      const appOrigin = (process.env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
      const link = appOrigin + '/?invite=' + token;
      return NextResponse.json({ invite, link }, { status: 201 });
    }

    // Default: add allowed email
    const parsed = addEmailSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid email', parsed.error.flatten());

    const existing = await prisma.allowedEmail.findUnique({ where: { email: parsed.data.email } });
    if (existing) return badRequest('Email already authorized');

    const entry = await prisma.allowedEmail.create({
      data: { email: parsed.data.email, addedBy: admin.email },
    });
    return NextResponse.json({ allowedEmail: entry }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/admin/users?email=...
export async function DELETE(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const admin = await requireAdmin(request);
  if (!isUser(admin)) return admin;

  try {
    const email = new URL(request.url).searchParams.get('email')?.toLowerCase();
    if (!email) return badRequest('Missing email query parameter');
    if (email === admin.email) return badRequest('Cannot remove your own email');

    const deleted = await prisma.allowedEmail.deleteMany({ where: { email } });
    if (deleted.count === 0) return notFound('Email not found in allowed list');

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    return serverError(err);
  }
}
