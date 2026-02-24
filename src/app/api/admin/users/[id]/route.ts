import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { checkRateLimit, requireAdmin, isUser } from '@/lib/server/middleware';
import { badRequest, notFound, serverError } from '@/lib/server/errors';

const updateSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional(),
  name: z.string().min(1).max(200).optional(),
});

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const admin = await requireAdmin(request);
  if (!isUser(admin)) return admin;

  try {
    const { id: userId } = await params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return notFound('User not found');

    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid data', parsed.error.flatten());

    const updated = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const admin = await requireAdmin(request);
  if (!isUser(admin)) return admin;

  try {
    const { id: userId } = await params;
    if (userId === admin.id) return badRequest('Impossible de supprimer votre propre compte');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return notFound('User not found');

    await prisma.user.delete({ where: { id: userId } });
    await prisma.allowedEmail.deleteMany({ where: { email: user.email } }).catch(err =>
      console.warn('[admin] Failed to remove allowedEmail on user delete:', err)
    );

    return NextResponse.json({ ok: true, id: userId });
  } catch (err) {
    return serverError(err);
  }
}
