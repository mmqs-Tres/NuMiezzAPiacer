'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/use-current-user';
import { UserRole } from '@mvp/contracts';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RideAnalyticsPage } from '@/slices/RideAnalytics/RideAnalytics.page';

export default function AnalisiCorsePage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && user.role !== UserRole.ADMIN) {
      router.push('/');
    }
  }, [user, router, mounted]);

  if (!mounted || !user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <AdminLayout>
      <RideAnalyticsPage />
    </AdminLayout>
  );
}
