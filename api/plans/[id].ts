import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../_lib/middleware';
import { badRequest, notFound, serverError, errorResponse } from '../_lib/errors';

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
  revSpec: z.number().int().min(0).optional(),
  capex: z.number().int().min(0).optional(),
  versionLabel: z.string().max(200).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['GET', 'PUT', 'DELETE'])) return;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { id } = req.query;
    if (typeof id !== 'string') {
      return badRequest(res, 'Invalid plan ID');
    }

    // Fetch plan and verify ownership
    const plan = await prisma.businessPlan.findUnique({ where: { id } });
    if (!plan || !plan.isActive) {
      return notFound(res, 'Plan not found');
    }
    if (plan.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse(res, 403, 'FORBIDDEN', 'Not your plan');
    }

    // GET — return full plan
    if (req.method === 'GET') {
      return res.status(200).json({ plan });
    }

    // DELETE — soft delete
    if (req.method === 'DELETE') {
      await prisma.businessPlan.update({
        where: { id },
        data: { isActive: false },
      });
      return res.status(200).json({ ok: true });
    }

    // PUT — update with auto-snapshot
    const parsed = updatePlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Invalid update data', parsed.error.flatten());
    }

    const updates = parsed.data;

    // Auto-snapshot before overwriting data
    if (updates.data) {
      const versionCount = await prisma.businessPlanVersion.count({
        where: { businessPlanId: id },
      });

      await prisma.businessPlanVersion.create({
        data: {
          businessPlanId: id,
          versionNumber: versionCount + 1,
          label: updates.versionLabel || `Auto-snapshot before update`,
          data: plan.data as any,
          constants: {
            consultDay: plan.consultDay,
            fee: plan.fee,
            daysYear: plan.daysYear,
            revSpec: plan.revSpec,
            capex: plan.capex,
          },
        },
      });
    }

    const updated = await prisma.businessPlan.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.data && { data: updates.data as any }),
        ...(updates.consultDay != null && { consultDay: updates.consultDay }),
        ...(updates.fee != null && { fee: updates.fee }),
        ...(updates.daysYear != null && { daysYear: updates.daysYear }),
        ...(updates.revSpec != null && { revSpec: updates.revSpec }),
        ...(updates.capex != null && { capex: updates.capex }),
      },
    });

    return res.status(200).json({ plan: updated });
  } catch (err) {
    return serverError(res, err);
  }
}
