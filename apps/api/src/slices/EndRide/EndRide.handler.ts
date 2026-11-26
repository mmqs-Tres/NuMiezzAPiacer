import { Request, Response } from 'express';
import { RideStatus, VehicleStatus } from '@mvp/contracts';
import { EndRideDeps } from './EndRide.types';

export function createEndRideHandler(deps: EndRideDeps) {
  return async (req: Request, res: Response): Promise<void> => {
    const rideId = req.params['rideId']!;
    const { userId, endLat, endLng, distanceKm } = req.body as {
      userId: string;
      endLat: number;
      endLng: number;
      distanceKm: number;
    };

    const ride = await deps.rideRepo.findById(rideId);
    if (!ride || ride.userId !== userId || (ride.status !== RideStatus.ACTIVE && ride.status !== RideStatus.PAUSED)) {
      res.status(404).json({ error: 'Active ride not found' });
      return;
    }

    // IF21 — Enforcement cantiere: blocca EndRide se ci si trova in un'area cantiere attiva.
    // Check distinto e prioritario rispetto al parking (cantiere = divieto assoluto).
    // TODO: EndRide.handler.ts resta un handler Express invece di un handler puro (debito tecnico dichiarato Sprint 22).
    const { blocked, zoneId } = await deps.zoneValidator.isInBlockedArea({ lat: endLat, lng: endLng });
    if (blocked) {
      res.status(422).json({
        error: "Impossibile concludere il noleggio: ti trovi in un'area cantiere. Sposta il veicolo fuori dall'area segnalata.",
        zoneId,
      });
      return;
    }

    const { valid } = await deps.zoneValidator.isInParkingZone({ lat: endLat, lng: endLng });
    if (!valid) {
      res.status(422).json({ error: 'Must end ride in a valid parking zone' });
      return;
    }

    const vehicle = await deps.vehicleRepo.findById(ride.vehicleId);
    if (!vehicle) {
      res.status(500).json({ error: 'Vehicle not found' });
      return;
    }

    const endedAt = new Date();
    const durationMinutes = (endedAt.getTime() - ride.startedAt.getTime()) / 60000;
    const totalCost = await deps.billingService.calculateRideCost(
      ride.startedAt,
      endedAt,
      distanceKm,
      vehicle.pricing
    );

    const endedRide = await deps.rideRepo.end(rideId, {
      endedAt,
      endLocation: { lat: endLat, lng: endLng },
      distanceKm,
      durationMinutes,
      totalCost,
    });

    await deps.vehicleRepo.updateStatus(ride.vehicleId, VehicleStatus.AVAILABLE);
    await deps.vehicleRepo.updateLocation(ride.vehicleId, { lat: endLat, lng: endLng });

    res.json({ ride: endedRide, totalCost });
  };
}
