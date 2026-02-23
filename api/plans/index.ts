import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../_lib/middleware';
import { badRequest, serverError } from '../_lib/errors';
import { DEFAULT_BUSINESS_PLAN_DATA } from '../../lib/constants';

// Validation: 36-element number array
const arr36 = z.array(z.number()).length(36);

const monthlyArraysSchema = z.object({
  ca: arr36, caAssoc: arr36, caIndep: arr36, caInterne: arr36, caSage: arr36,
  result: arr36, cashflow: arr36, treso1m: arr36, treso3m: arr36,
  admin: arr36, opex: arr36, lab: arr36,
  fteAssoc: arr36, fteIndep: arr36, fteInterne: arr36, fteAdmin: arr36, fteTotal: arr36,
});

const createPlanSchema = z.object({
  name: z.string().min(1).max(200),
  data: monthlyArraysSchema.optional(),
  consultDay: z.number().int().min(1).max(50).optional(),
  fee: z.number().int().min(50).max(1000).optional(),
  daysYear: z.number().int().min(100).max(365).optional(),
  revSpec: z.number().int().min(0).max(10000000).optional(),
  capex: z.number().int().min(0).max(5000000).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const plans = await prisma.businessPlan.findMany({
        where: { userId: user.id, isActive: true },
        select: {
          id: true,
          name: true,
          consultDay: true,
          fee: true,
          daysYear: true,
          revSpec: true,
          capex: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
      return res.status(200).json({ plans });
    }

    // POST — create plan
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Invalid plan data', parsed.error.flatten());
    }

    const { name, data, consultDay, fee, daysYear, revSpec, capex } = parsed.data;
    const defaults = DEFAULT_BUSINESS_PLAN_DATA;

    const plan = await prisma.businessPlan.create({
      data: {
        userId: user.id,
        name,
        data: data ?? {
          ca: defaults.ca, caAssoc: defaults.caAssoc, caIndep: defaults.caIndep,
          caInterne: defaults.caInterne, caSage: defaults.caSage,
          result: defaults.result, cashflow: defaults.cashflow,
          treso1m: defaults.treso1m, treso3m: defaults.treso3m,
          admin: defaults.admin, opex: defaults.opex, lab: defaults.lab,
          fteAssoc: defaults.fteAssoc, fteIndep: defaults.fteIndep,
          fteInterne: defaults.fteInterne, fteAdmin: defaults.fteAdmin,
          fteTotal: defaults.fteTotal,
        },
        consultDay: consultDay ?? defaults.consultDay,
        fee: fee ?? defaults.fee,
        daysYear: daysYear ?? defaults.daysYear,
        revSpec: revSpec ?? defaults.revSpec,
        capex: capex ?? defaults.capex,
      },
    });

    return res.status(201).json({ plan });
  } catch (err) {
    return serverError(res, err);
  }
}
