import { Request, Response } from 'express';
import { BookingStatus, RideStatus } from '@mvp/contracts';
import { RestoreSessionDeps } from './RestoreSession.types';

const serverBootId = Math.random().toString(36).substring(2) + Date.now().toString(36);

const ACTIVE_BOOKING_STATUSES = new Set<string>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.ACTIVE,
]);

export function createRestoreSessionHandler(deps: RestoreSessionDeps) {
  return async (req: Request, res: Response): Promise<void> => {
    const userId = req.query['userId'] as string;
    if (!userId) {
      res.json({ ride: null, booking: null, vehicle: null, serverBootId });
      return;
    }

    const [ride, booking] = await Promise.all([
      deps.rideRepo.findActiveByUserId(userId),
      deps.bookingRepo.findActiveByUserId(userId),
    ]);

    const activeRide = ride && (ride.status === RideStatus.ACTIVE || ride.status === RideStatus.PAUSED)
      ? ride
      : null;

    const activeBooking = booking && ACTIVE_BOOKING_STATUSES.has(booking.status)
      ? booking
      : null;

    const vehicleId = activeRide?.vehicleId ?? activeBooking?.vehicleId ?? null;
    const vehicle = vehicleId ? await deps.vehicleRepo.findById(vehicleId) : null;

    res.json({ ride: activeRide, booking: activeBooking, vehicle, serverBootId });
  };
}
