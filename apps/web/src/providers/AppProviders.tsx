'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app.store';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Ride, Booking, Vehicle } from '@mvp/contracts';

interface SessionSnapshot {
  ride: Ride | null;
  booking: Booking | null;
  vehicle: Vehicle | null;
  serverBootId?: string;
}

function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  const userId = useAppStore((s) => s.currentUserId);
  const serverBootId = useAppStore((s) => s.serverBootId);
  const setServerBootId = useAppStore((s) => s.setServerBootId);
  const clearSession = useAppStore((s) => s.clearSession);
  const setCurrentUserId = useAppStore((s) => s.setCurrentUserId);
  const setActiveRide = useAppStore((s) => s.setActiveRide);
  const setActiveBooking = useAppStore((s) => s.setActiveBooking);
  const setSelectedVehicle = useAppStore((s) => s.setSelectedVehicle);
  const restored = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch session & boot ID from the server
  const { data } = useQuery<SessionSnapshot>({
    queryKey: ['session', userId],
    queryFn: () => apiFetch<SessionSnapshot>(`/api/session?userId=${userId}`),
    staleTime: 0,
    enabled: mounted && !!userId,
  });

  useEffect(() => {
    if (!mounted) return;

    // 1. If not logged in, redirect to login page (unless already there)
    if (!userId) {
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    // 2. If data is loaded, check for server reboot
    if (data) {
      if (data.serverBootId && serverBootId && data.serverBootId !== serverBootId) {
        // Invalidate session because server restarted
        clearSession();
        setCurrentUserId('');
        setServerBootId(data.serverBootId);
        router.push('/login');
        return;
      }

      if (data.serverBootId && data.serverBootId !== serverBootId) {
        setServerBootId(data.serverBootId);
      }

      // Restore session data locally if not done yet
      if (!restored.current) {
        restored.current = true;
        setActiveRide(data.ride);
        setActiveBooking(data.booking);
        setSelectedVehicle(data.vehicle);
      }
    }
  }, [mounted, userId, data, serverBootId, pathname, router, clearSession, setCurrentUserId, setServerBootId, setActiveRide, setActiveBooking, setSelectedVehicle]);

  if (!mounted) return null;

  // Render children if we are on login page, or if we have a user
  // This prevents layout flashes before redirection
  if (!userId && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionGuard>{children}</SessionGuard>
    </QueryClientProvider>
  );
}
