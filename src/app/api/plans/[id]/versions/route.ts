import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { checkRateLimit, requireAuth, isUser } from '@/lib/server/middleware';
import { badRequest, notFound, serverError, errorResponse } from '@/lib/server/errors';

type Params = { params: Promise<{ id: string }> };

// GET /api/plans/[id]/versions
export async function GET(request: NextRequest, { params }: Params) {
  const limited = checkRateLimit(request);
  if (limited) return limited;

  const user = await requireAuth(request);
  if (!isUser(user)) return user;

  try {
    const { id } = await params;

    const plan = await prisma.businessPlan.findUnique({
      where: { id },
      select: { userId: true, isActive: true },
    });
    if (!plan || !plan.isActive) return notFound('Plan not found');
    if (plan.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse(403, 'FORBIDDEN', 'Not your plan');
    }

    const versions = await prisma.businessPlanVersion.findMany({
      where: { businessPlanId: id },
      orderBy: { versionNumber: 'desc' },
      select: { id: true, versionNumber: true, label: true, createdAt: true },
    });

    return NextResponse.json({ versions });
  } catch (err) {
    return serverError(err);
  }
}
