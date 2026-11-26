import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vehicle, Ride, Booking } from '@mvp/contracts';

export const DEFAULT_USER_ID = 'u1';

interface AppState {
  // Active session state
  currentUserId: string;
  serverBootId: string | null;
  selectedVehicle: Vehicle | null;
  activeBooking: Booking | null;
  activeRide: Ride | null;

  // Actions
  setCurrentUserId: (userId: string) => void;
  setServerBootId: (bootId: string | null) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setActiveBooking: (booking: Booking | null) => void;
  setActiveRide: (ride: Ride | null) => void;
  clearSession: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUserId: DEFAULT_USER_ID,
      serverBootId: null,
      selectedVehicle: null,
      activeBooking: null,
      activeRide: null,

      setCurrentUserId: (userId) => set({ currentUserId: userId }),
      setServerBootId: (bootId) => set({ serverBootId: bootId }),
      setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
      setActiveBooking: (booking) => set({ activeBooking: booking }),
      setActiveRide: (ride) => set({ activeRide: ride }),
      clearSession: () => set({ selectedVehicle: null, activeBooking: null, activeRide: null }),
    }),
    {
      name: 'mvp-app-store',
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        serverBootId: state.serverBootId,
      }),
    }
  )
);
