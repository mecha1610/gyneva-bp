import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server/auth';
import type { NextRequest } from 'next/server';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import AppStoreInitializer from '@/components/AppStoreInitializer';
import styles from './layout.module.css';
import { prisma } from '@/lib/server/db';
import type { ApiBusinessPlan } from '@lib/types';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const fakeReq = {
    cookies: {
      get: (name: string) => {
        const c = allCookies.find(c => c.name === name);
        return c ? { value: c.value } : undefined;
      },
    },
  } as unknown as NextRequest;
  return getSessionUser(fakeReq);
}

async function getUserPlans(userId: string): Promise<ApiBusinessPlan[]> {
  const plans = await prisma.businessPlan.findMany({
    where: { userId, isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
  return plans.map(p => ({
    id: p.id,
    name: p.name,
    data: p.data as unknown as ApiBusinessPlan['data'],
    consultDay: p.consultDay,
    fee: p.fee,
    daysYear: p.daysYear,
    revSpec: p.revSpec,
    capex: p.capex,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isAdmin = user.role === 'ADMIN';
  const plans = await getUserPlans(user.id);

  const firstPlan = plans[0] ?? null;

  return (
    <div className={styles.layout}>
      {/* Initialize client-side stores from server data */}
      <AppStoreInitializer
        plans={plans}
        currentPlanId={firstPlan?.id ?? null}
        firstPlanData={firstPlan ? {
          ca: firstPlan.data.ca,
          caAssoc: firstPlan.data.caAssoc,
          caIndep: firstPlan.data.caIndep,
          caInterne: firstPlan.data.caInterne,
          caSage: firstPlan.data.caSage,
          result: firstPlan.data.result,
          cashflow: firstPlan.data.cashflow,
          treso1m: firstPlan.data.treso1m,
          treso3m: firstPlan.data.treso3m,
          admin: firstPlan.data.admin,
          opex: firstPlan.data.opex,
          lab: firstPlan.data.lab,
          fteAssoc: firstPlan.data.fteAssoc,
          fteIndep: firstPlan.data.fteIndep,
          fteInterne: firstPlan.data.fteInterne,
          fteAdmin: firstPlan.data.fteAdmin,
          fteTotal: firstPlan.data.fteTotal,
          consultDay: firstPlan.consultDay,
          fee: firstPlan.fee,
          daysYear: firstPlan.daysYear,
          revSpec: firstPlan.revSpec,
          capex: firstPlan.capex,
        } : null}
        theme="light"
        lang="fr"
      />

      <Sidebar isAdmin={isAdmin} />
      <div className={styles.mainArea}>
        <Topbar
          userName={user.name ?? user.email}
          userPicture={user.picture ?? undefined}
        />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
