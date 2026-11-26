'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';
import type { ProfileResponse } from './Profile.types';

export function useProfile() {
  const userId = useAppStore((s) => s.currentUserId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => apiFetch<ProfileResponse>(`/api/profile?userId=${userId}`),
  });

  return {
    profile: data?.profile ?? null,
    isLoading,
    error: error as Error | null,
  };
}
