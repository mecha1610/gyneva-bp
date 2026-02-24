import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { checkRateLimit, requireAuth, isUser } from '@/lib/server/middleware';
import { badRequest, serverError } from '@/lib/server/errors';

const paramsSchema = z.object({
  consult: z.number().int().min(8).max(24),
  fee: z.number().int().min(120).max(350),
  days: z.number().int().min(180).max(250),
  assoc: z.number().int().min(1).max(4),
  indep: z.number().int().min(0).max(6),
  interne: z.number().int().min(0).max(4),
  start: z.number().int().min(1).max(12),
  occup: z.number().int().min(30).max(100),
  cashPct: z.number().int().min(0).max(30),
  delay: z.number().int().refine(v => [0, 1, 3].includes(v)),
  factoring: z.boolean(),
  extra: z.number().int().min(0).max(400000),
  rc: z.number().int().min(0).max(120000),
  retro: z.number().int().min(20).max(60).optional().default(40),
});

const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  params: paramsSchema,
  businessPlanId: z.string().optional(),
  isShared: z.boolean().optional(),
});

// GET /api/scenarios?planId=...
export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const user = await requireAuth(request);
  if (!isUser(user)) return user;

  try {
    const planId = new URL(request.url).searchParams.get('planId');

    const scenarios = await prisma.simulatorScenario.findMany({
      where: {
        OR: [{ userId: user.id }, { isShared: true }],
        ...(planId ? { businessPlanId: planId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ scenarios });
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/scenarios
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const user = await requireAuth(request);
  if (!isUser(user)) return user;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createScenarioSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid scenario data', parsed.error.flatten());

    const { name, params, businessPlanId, isShared } = parsed.data;

    if (businessPlanId) {
      const plan = await prisma.businessPlan.findUnique({ where: { id: businessPlanId } });
      if (!plan || !plan.isActive || (plan.userId !== user.id && user.role !== 'ADMIN')) {
        return badRequest('Invalid or unauthorized business plan');
      }
    }

    const scenario = await prisma.simulatorScenario.create({
      data: {
        userId: user.id,
        name,
        params: params as Prisma.InputJsonValue,
        businessPlanId: businessPlanId || null,
        isShared: isShared ?? false,
      },
    });

    return NextResponse.json({ scenario }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
