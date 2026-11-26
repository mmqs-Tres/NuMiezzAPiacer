import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { FleetOverviewResponse, RemoteCommandResult } from '@mvp/contracts';

export function useRemoteBlockFleet() {
  const query = useQuery<FleetOverviewResponse, Error>({
    queryKey: ['fleetOverview'],
    queryFn: () => apiFetch('/api/operator/fleet'),
  });

  return {
    vehicles: query.data?.vehicles ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useRemoteBlock() {
  const queryClient = useQueryClient();

  const invalidateFleet = () => {
    queryClient.invalidateQueries({ queryKey: ['fleetOverview'] });
  };

  const blockMutation = useMutation<RemoteCommandResult, Error, string>({
    mutationFn: (vehicleId) => apiFetch(`/api/operator/vehicles/${vehicleId}/block`, { method: 'POST' }),
    onSuccess: invalidateFleet,
  });

  const unblockMutation = useMutation<RemoteCommandResult, Error, string>({
    mutationFn: (vehicleId) => apiFetch(`/api/operator/vehicles/${vehicleId}/unblock`, { method: 'POST' }),
    onSuccess: invalidateFleet,
  });

  return {
    block: blockMutation.mutate,
    unblock: unblockMutation.mutate,
    isPending: blockMutation.isPending || unblockMutation.isPending,
    blockError: blockMutation.error,
    unblockError: unblockMutation.error,
    blockData: blockMutation.data,
    unblockData: unblockMutation.data,
    reset: () => {
      blockMutation.reset();
      unblockMutation.reset();
    },
  };
}
