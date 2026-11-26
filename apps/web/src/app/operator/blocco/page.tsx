'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/use-current-user';
import { UserRole } from '@mvp/contracts';
import { OperatorLayout } from '@/components/layout/OperatorLayout';
import { RemoteBlockPage } from '@/slices/RemoteBlock/RemoteBlock.page';

export default function OperatorBloccoPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && user.role !== UserRole.OPERATOR) {
      router.push('/');
    }
  }, [user, router, mounted]);

  if (!mounted || !user || user.role !== UserRole.OPERATOR) {
    return null; // Don't render anything while redirecting or mounting
  }

  return (
    <OperatorLayout>
      <RemoteBlockPage />
    </OperatorLayout>
  );
}
