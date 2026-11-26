import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { RideAnalyticsResponse } from '@mvp/contracts';
import { RangePreset } from './RideAnalytics.types';

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useRideAnalytics(preset: RangePreset) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (preset - 1));
  const fromStr = formatDate(from);
  const toStr = formatDate(to);

  const query = useQuery<RideAnalyticsResponse, Error>({
    queryKey: ['rideAnalytics', fromStr, toStr],
    queryFn: () => apiFetch(`/api/admin/analytics/rides?from=${fromStr}&to=${toStr}`),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
