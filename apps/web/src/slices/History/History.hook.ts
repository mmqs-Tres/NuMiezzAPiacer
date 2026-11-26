'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';
import type { HistoryResponse } from './History.types';

export function useHistory() {
  const userId = useAppStore((s) => s.currentUserId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['history', userId],
    queryFn: () => apiFetch<HistoryResponse>(`/api/history?userId=${userId}`),
  });

  return {
    rides: data?.rides ?? [],
    isLoading,
    error: error as Error | null,
  };
}
