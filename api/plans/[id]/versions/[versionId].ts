import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../../_lib/db';
import { setCors, checkRateLimit, allowMethods, requireAuth } from '../../../_lib/middleware';
import { badRequest, notFound, serverError, errorResponse } from '../../../_lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (checkRateLimit(req, res)) return;
  if (!allowMethods(req, res, ['GET'])) return;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { id, versionId } = req.query;
    if (typeof id !== 'string') {
      return badRequest(res, 'Invalid plan ID');
    }
    if (typeof versionId !== 'string') {
      return badRequest(res, 'Invalid version ID');
    }

    // Verify plan ownership
    const plan = await prisma.businessPlan.findUnique({
      where: { id },
      select: { userId: true, isActive: true },
    });
    if (!plan || !plan.isActive) {
      return notFound(res, 'Plan not found');
    }
    if (plan.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse(res, 403, 'FORBIDDEN', 'Not your plan');
    }

    // Fetch specific version with full data
    const version = await prisma.businessPlanVersion.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        versionNumber: true,
        label: true,
        data: true,
        constants: true,
        createdAt: true,
        businessPlanId: true,
      },
    });

    if (!version || version.businessPlanId !== id) {
      return notFound(res, 'Version not found');
    }

    return res.status(200).json({ version });
  } catch (err) {
    return serverError(res, err);
  }
}
