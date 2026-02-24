import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { hashPassword, createSession, sessionCookieOptions } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/middleware';
import { badRequest, errorResponse } from '@/lib/server/errors';

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

// GET /api/auth/invite/[token]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const { token } = await params;
  if (!token) return badRequest('Missing token');

  const invite = await findValidToken(token);
  if (!invite) {
    return errorResponse(410, 'INVITE_INVALID', 'Invitation invalide ou expirée');
  }
  return NextResponse.json({ email: invite.email, role: invite.role });
}

// POST /api/auth/invite/[token]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const { token } = await params;
  if (!token) return badRequest('Missing token');

  try {
    const invite = await findValidToken(token);
    if (!invite) {
      return errorResponse(410, 'INVITE_INVALID', 'Invitation invalide ou expirée');
    }

    const body = await request.json().catch(() => ({}));
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid data', parsed.error.flatten());

    const { name, password } = parsed.data;
    const hash = await hashPassword(password);

    let user: Awaited<ReturnType<typeof prisma.user.create>>;
    try {
      user = await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email: invite.email } });
        if (existing) throw Object.assign(new Error('DUPLICATE_EMAIL'), { code: 'DUPLICATE_EMAIL' });

        const created = await tx.user.create({
          data: { email: invite.email, name, passwordHash: hash, role: invite.role, lastLoginAt: new Date() },
        });

        await tx.inviteToken.update({ where: { id: invite.id }, data: { usedAt: new Date() } });

        await tx.allowedEmail.upsert({
          where: { email: invite.email },
          update: {},
          create: { email: invite.email, addedBy: invite.createdBy },
        });

        return created;
      });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'DUPLICATE_EMAIL') {
        return badRequest('Un compte existe déjà pour cet email');
      }
      throw err;
    }

    const sessionToken = await createSession(user.id);
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, picture: user.picture, role: user.role } },
      { status: 201 }
    );
    response.cookies.set(sessionCookieOptions(sessionToken));
    return response;
  } catch (err) {
    console.error('[API Error]', err);
    return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}
