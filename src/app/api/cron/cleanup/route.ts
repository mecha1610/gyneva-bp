import { NextRequest, NextResponse } from 'next/server';
import { cleanExpiredSessions } from '@/lib/server/auth';

// GET /api/cron/cleanup — called daily by Vercel Cron
// Protected by CRON_SECRET to prevent unauthorised invocations
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await cleanExpiredSessions();
    console.log(`[cron/cleanup] Deleted ${deleted} expired sessions`);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error('[cron/cleanup] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
