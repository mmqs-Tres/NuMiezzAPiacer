import { IFaultReportRepository, IVehicleRepository } from '@mvp/contracts';
import { FaultRegistryResponse } from '@mvp/contracts';

export interface FaultRegistryDeps {
  faultReportRepo: IFaultReportRepository;
  vehicleRepo: IVehicleRepository;
}

export interface FaultRegistryInput {
  // Empty for now, filtering is done client-side
}

export type FaultRegistryOutput = FaultRegistryResponse;
