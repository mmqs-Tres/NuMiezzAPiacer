import { IRideRepository, IVehicleRepository, RideAnalyticsResponse } from '@mvp/contracts';

export interface RideAnalyticsDeps {
  rideRepo: IRideRepository;
  vehicleRepo: IVehicleRepository;
}

export interface RideAnalyticsInput {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

export type RideAnalyticsOutput = RideAnalyticsResponse;

export class RideAnalyticsValidationError extends Error {}
