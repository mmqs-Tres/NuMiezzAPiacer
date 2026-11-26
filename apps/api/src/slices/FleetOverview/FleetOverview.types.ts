import { IVehicleRepository } from '@mvp/contracts';
import { FleetOverviewResponse } from '@mvp/contracts';

export interface FleetOverviewDeps {
  vehicleRepo: IVehicleRepository;
}

export interface FleetOverviewInput {
  // Empty for now, filtering is done client-side
}

export type FleetOverviewOutput = FleetOverviewResponse;
