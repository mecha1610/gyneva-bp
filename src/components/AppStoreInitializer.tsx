'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useSimStore } from '@/stores/useSimStore';
import { DEFAULT_BUSINESS_PLAN_DATA } from '@lib/constants';
import type { BusinessPlanData, ApiBusinessPlan } from '@lib/types';

interface Props {
  plans: ApiBusinessPlan[];
  currentPlanId: string | null;
  firstPlanData: BusinessPlanData | null;
  theme: 'light' | 'dark';
  lang: 'fr' | 'en';
}

/**
 * Renders nothing — seeds client stores with server-fetched data once on mount.
 * Must be inside the layout so it runs before child pages render.
 */
export default function AppStoreInitializer({
  plans,
  currentPlanId,
  firstPlanData,
}: Props) {
  const initialized = useRef(false);

  const setPlans        = useAppStore(s => s.setPlans);
  const setCurrentPlanId = useAppStore(s => s.setCurrentPlanId);
  const loadPlanData     = useSimStore(s => s.loadPlanData);
  const theme            = useAppStore(s => s.theme);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setPlans(plans);
    if (currentPlanId) setCurrentPlanId(currentPlanId);
    loadPlanData(firstPlanData ?? DEFAULT_BUSINESS_PLAN_DATA);
  }, [plans, currentPlanId, firstPlanData, setPlans, setCurrentPlanId, loadPlanData]);

  // Apply persisted theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
  }, [theme]);

  return null;
}
