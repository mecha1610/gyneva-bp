import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { checkRateLimit, requireAuth, isUser } from '@/lib/server/middleware';
import { badRequest, notFound, serverError, errorResponse } from '@/lib/server/errors';

const arr36 = z.array(z.number()).length(36);
const monthlyArraysSchema = z.object({
  ca: arr36, caAssoc: arr36, caIndep: arr36, caInterne: arr36, caSage: arr36,
  result: arr36, cashflow: arr36, treso1m: arr36, treso3m: arr36,
  admin: arr36, opex: arr36, lab: arr36,
  fteAssoc: arr36, fteIndep: arr36, fteInterne: arr36, fteAdmin: arr36, fteTotal: arr36,
});

const updatePlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  data: monthlyArraysSchema.optional(),
  consultDay: z.number().int().min(1).max(50).optional(),
  fee: z.number().int().min(50).max(1000).optional(),
  daysYear: z.number().int().min(100).max(365).optional(),
  revSpec: z.number().int().min(0).max(10000000).optional(),
  capex: z.number().int().min(0).max(5000000).optional(),
  versionLabel: z.string().max(200).optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/plans/[id]
export async function GET(request: NextRequest, { params }: Params) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const user = await requireAuth(request);
  if (!isUser(user)) return user;

  try {
    const { id } = await params;
    const plan = await prisma.businessPlan.findUnique({ where: { id } });
    if (!plan || !plan.isActive) return notFound('Plan not found');
    if (plan.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse(403, 'FORBIDDEN', 'Not your plan');
    }
    return NextResponse.json({ plan });
  } catch (err) {
    return serverError(err);
  }
}

// PUT /api/plans/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const user = await requireAuth(request);
  if (!isUser(user)) return user;

  try {
    const { id } = await params;
    const plan = await prisma.businessPlan.findUnique({ where: { id } });
    if (!plan || !plan.isActive) return notFound('Plan not found');
    if (plan.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse(403, 'FORBIDDEN', 'Not your plan');
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid update data', parsed.error.flatten());

    const updates = parsed.data;

    // Auto-snapshot before overwriting data
    if (updates.data) {
      const versionCount = await prisma.businessPlanVersion.count({ where: { businessPlanId: id } });
      await prisma.businessPlanVersion.create({
        data: {
          businessPlanId: id,
          versionNumber: versionCount + 1,
          label: updates.versionLabel || 'Auto-snapshot before update',
          data: plan.data as Prisma.InputJsonValue,
          constants: {
            consultDay: plan.consultDay, fee: plan.fee, daysYear: plan.daysYear,
            revSpec: plan.revSpec, capex: plan.capex,
          },
        },
      });
    }

    const updated = await prisma.businessPlan.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.data && { data: updates.data as Prisma.InputJsonValue }),
        ...(updates.consultDay != null && { consultDay: updates.consultDay }),
        ...(updates.fee != null && { fee: updates.fee }),
        ...(updates.daysYear != null && { daysYear: updates.daysYear }),
        ...(updates.revSpec != null && { revSpec: updates.revSpec }),
        ...(updates.capex != null && { capex: updates.capex }),
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/plans/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const user = await requireAuth(request);
  if (!isUser(user)) return user;

  try {
    const { id } = await params;
    const plan = await prisma.businessPlan.findUnique({ where: { id } });
    if (!plan || !plan.isActive) return notFound('Plan not found');
    if (plan.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse(403, 'FORBIDDEN', 'Not your plan');
    }

    await prisma.businessPlan.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
