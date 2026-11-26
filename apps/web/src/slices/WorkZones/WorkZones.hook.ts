import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { WorkZone } from '@mvp/contracts';

const QUERY_KEY = ['workZones'] as const;

export function useWorkZones() {
  const queryClient = useQueryClient();

  const listQuery = useQuery<WorkZone[], Error>({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<WorkZone[]>('/api/admin/work-zones'),
  });

  const createMutation = useMutation<
    WorkZone,
    Error,
    { name: string; polygon: { lat: number; lng: number }[]; notes?: string }
  >({
    mutationFn: (input) =>
      apiFetch<WorkZone>('/api/admin/work-zones', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    // Lista
    zones: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    listError: listQuery.error,
    refetch: listQuery.refetch,
    // Creazione
    createWorkZone: createMutation.mutateAsync,
    isPending: createMutation.isPending,
    createError: createMutation.error,
  };
}
