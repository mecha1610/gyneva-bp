import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db.js';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../_lib/middleware.js';
import { badRequest, serverError } from '../_lib/errors.js';

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
});

const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  params: paramsSchema,
  businessPlanId: z.string().optional(),
  isShared: z.boolean().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { planId } = req.query;

      const scenarios = await prisma.simulatorScenario.findMany({
        where: {
          OR: [
            { userId: user.id },
            { isShared: true },
          ],
          ...(typeof planId === 'string' ? { businessPlanId: planId } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      });

      return res.status(200).json({ scenarios });
    }

    // POST
    const parsed = createScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Invalid scenario data', parsed.error.flatten());
    }

    const { name, params, businessPlanId, isShared } = parsed.data;

    const scenario = await prisma.simulatorScenario.create({
      data: {
        userId: user.id,
        name,
        params: params as any,
        businessPlanId: businessPlanId || null,
        isShared: isShared ?? false,
      },
    });

    return res.status(201).json({ scenario });
  } catch (err) {
    return serverError(res, err);
  }
}
