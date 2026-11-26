import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { FleetOverviewResponse } from '@mvp/contracts';

export function useFleetOverview() {
  const query = useQuery<FleetOverviewResponse, Error>({
    queryKey: ['fleetOverview'],
    queryFn: () => apiFetch('/api/operator/fleet'),
    refetchInterval: 30000,
  });

  return {
    vehicles: query.data?.vehicles ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
