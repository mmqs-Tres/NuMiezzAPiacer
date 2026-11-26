import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { FaultRegistryResponse } from '@mvp/contracts';

export function useFaultRegistry() {
  const query = useQuery<FaultRegistryResponse, Error>({
    queryKey: ['faultRegistry'],
    queryFn: () => apiFetch('/api/operator/fault-reports'),
  });

  return {
    reports: query.data?.reports ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
