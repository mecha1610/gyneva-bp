import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { checkRateLimit, requireAuth, isUser } from '@/lib/server/middleware';
import { badRequest, notFound, serverError, errorResponse } from '@/lib/server/errors';

type Params = { params: Promise<{ id: string; versionId: string }> };

// GET /api/plans/[id]/versions/[versionId]
export async function GET(request: NextRequest, { params }: Params) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const user = await requireAuth(request);
  if (!isUser(user)) return user;

  try {
    const { id, versionId } = await params;

    if (!id) return badRequest('Invalid plan ID');
    if (!versionId) return badRequest('Invalid version ID');

    const plan = await prisma.businessPlan.findUnique({
      where: { id },
      select: { userId: true, isActive: true },
    });
    if (!plan || !plan.isActive) return notFound('Plan not found');
    if (plan.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse(403, 'FORBIDDEN', 'Not your plan');
    }

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
      return notFound('Version not found');
    }

    return NextResponse.json({ version });
  } catch (err) {
    return serverError(err);
  }
}
