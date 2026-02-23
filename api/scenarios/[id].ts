import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../_lib/middleware';
import { badRequest, notFound, serverError, errorResponse } from '../_lib/errors';

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

const updateScenarioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  params: paramsSchema.optional(),
  isShared: z.boolean().optional(),
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
      return badRequest(res, 'Invalid scenario ID');
    }

    const scenario = await prisma.simulatorScenario.findUnique({ where: { id } });
    if (!scenario) {
      return notFound(res, 'Scenario not found');
    }
    if (scenario.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse(res, 403, 'FORBIDDEN', 'Not your scenario');
    }

    if (req.method === 'GET') {
      return res.status(200).json({ scenario });
    }

    if (req.method === 'DELETE') {
      await prisma.simulatorScenario.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }

    // PUT
    const parsed = updateScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(res, 'Invalid update data', parsed.error.flatten());
    }

    const updated = await prisma.simulatorScenario.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.params && { params: parsed.data.params as any }),
        ...(parsed.data.isShared != null && { isShared: parsed.data.isShared }),
      },
    });

    return res.status(200).json({ scenario: updated });
  } catch (err) {
    return serverError(res, err);
  }
}
